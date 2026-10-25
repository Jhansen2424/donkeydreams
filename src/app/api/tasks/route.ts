import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { unlogged } from "@/lib/audit";

// Server shape matches the ScheduleTask UI shape closely, plus `id` and `block`
// so the client can group tasks into blocks.
interface ApiTask {
  id: string;
  task: string;
  block: string;           // "AM" | "Mid" | "PM"
  category: string;        // legacy — tags[0]
  tags: string[];
  date: string;            // ISO YYYY-MM-DD
  assignedTo: string | null;
  done: boolean;
  note: string | null;
  animalSpecific: string | null;
  templateId: string | null;
  sortOrder: number;
  sticky: boolean;
  outcome: string;
  outcomeNote: string;
  dueDate: string | null;
  repeat: string | null;
  completedAt: string | null;
  createdAt: string;
}

function toApi(row: {
  id: string;
  task: string;
  block: string;
  category: string;
  tags: string[];
  date: string;
  assignedTo: string | null;
  done: boolean;
  note: string | null;
  templateId: string | null;
  sortOrder: number;
  sticky: boolean;
  outcome: string;
  outcomeNote: string;
  dueDate: string | null;
  repeat?: string | null;
  completedAt?: Date | null;
  createdAt: Date;
}, animalSpecific: string | null): ApiTask {
  return {
    id: row.id,
    task: row.task,
    block: row.block,
    category: row.category,
    tags: row.tags.length > 0 ? row.tags : row.category ? [row.category] : [],
    date: row.date,
    assignedTo: row.assignedTo,
    done: row.done,
    note: row.note,
    animalSpecific,
    templateId: row.templateId,
    sortOrder: row.sortOrder,
    sticky: row.sticky,
    outcome: row.outcome,
    outcomeNote: row.outcomeNote,
    dueDate: row.dueDate,
    repeat: row.repeat ?? null,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

function isIsoDate(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

// How often a repeating admin task comes back.
const REPEATS = new Set(["daily", "weekly", "monthly", "quarterly", "yearly"]);
const cleanRepeat = (v: unknown): string | null =>
  typeof v === "string" && REPEATS.has(v) ? v : null;

// The next due date for a repeating task: one interval on from its due date
// (or from today when it had none), moved on again until it's after today,
// so finishing an overdue task doesn't create one that's already overdue.
// Each step counts from the original date, so a task due on the 31st lands
// on the last day of shorter months (Feb 28) and is back on the 31st after.
function nextDue(from: string, repeat: string, today: string): string {
  const [y, m, d] = from.split("-").map(Number);
  const nth = (k: number): string => {
    if (repeat === "daily" || repeat === "weekly") {
      const dt = new Date(Date.UTC(y, m - 1, d + k * (repeat === "daily" ? 1 : 7)));
      return dt.toISOString().slice(0, 10);
    }
    const months = repeat === "monthly" ? 1 : repeat === "quarterly" ? 3 : 12;
    const total = m - 1 + k * months;
    const ny = y + Math.floor(total / 12);
    const nm = total % 12;
    const last = new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate();
    return new Date(Date.UTC(ny, nm, Math.min(d, last))).toISOString().slice(0, 10);
  };
  let k = 1;
  while (nth(k) <= today && k < 5000) k++;
  return nth(k);
}

// Sanitize a client-provided tags payload down to a clean string array.
function cleanTags(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const tags = v.filter((t): t is string => typeof t === "string" && t.length > 0 && t.length < 40);
  return tags.slice(0, 10);
}

// `TaskCompletion` has no `animalSpecific` column, so we encode it inside the
// `note` field with a prefix when present: "[animal:Pete] real note here".
// This avoids a schema migration for the Phase C rollout.
const ANIMAL_PREFIX = /^\[animal:([^\]]+)\]\s*/;
function extractAnimal(note: string | null): { animal: string | null; cleanNote: string | null } {
  if (!note) return { animal: null, cleanNote: null };
  const match = note.match(ANIMAL_PREFIX);
  if (!match) return { animal: null, cleanNote: note };
  const rest = note.replace(ANIMAL_PREFIX, "").trim();
  return { animal: match[1], cleanNote: rest || null };
}
function encodeNote(note: string | null | undefined, animal: string | null | undefined): string | null {
  const animalPart = animal ? `[animal:${animal}] ` : "";
  const notePart = note ?? "";
  const combined = `${animalPart}${notePart}`.trim();
  return combined || null;
}

function todayIso(): string {
  return new Date().toISOString().split("T")[0];
}

// Materialize active recurring templates into TaskCompletion rows for the
// requested day, so a routine item entered once appears every matching day.
// Idempotent: the @@unique([templateId, date]) constraint makes concurrent
// loads safe (duplicate creates just fail quietly). Only today/future days
// materialize (with one day of slack for the server's UTC clock vs the
// sanctuary's local date) — paging back through history never invents rows.
// Days the user explicitly deleted an instance for (template.skipDates) stay
// deleted.
async function materializeTemplates(date: string): Promise<void> {
  const utcToday = todayIso();
  const yesterday = new Date(Date.parse(utcToday) - 86_400_000)
    .toISOString()
    .split("T")[0];
  if (date < yesterday) return;

  const templates = await db.taskTemplate.findMany({ where: { active: true } });
  if (templates.length === 0) return;
  const weekday = new Date(date + "T12:00:00Z").getUTCDay();
  // Skip routines already copied onto this day (one query, instead of trying
  // every create and letting the duplicates fail, which made each load slow).
  const have = new Set(
    (
      await db.taskCompletion.findMany({
        where: { date, templateId: { not: null } },
        select: { templateId: true },
      })
    ).map((r) => r.templateId)
  );

  for (const t of templates) {
    if (have.has(t.id)) continue;
    if (t.repeatDays.length > 0 && !t.repeatDays.includes(weekday)) continue;
    if (t.skipDates.includes(date)) continue;
    // A routine never materializes into days BEFORE it was created — adding
    // a task today must not backfill it onto yesterday's list (client saw
    // today's new routines appear on yesterday, 9/15). Creation date is
    // taken in sanctuary-local time (Arizona, no DST) so a UTC timestamp
    // from an evening create doesn't count as "tomorrow".
    const createdIso = t.createdAt.toLocaleDateString("en-CA", {
      timeZone: "America/Phoenix",
    });
    if (date < createdIso) continue;
    try {
      // Automatic daily copy, not a person's change: kept out of the history.
      await unlogged(() => db.taskCompletion.create({
        data: {
          templateId: t.id,
          task: t.task,
          block: t.block,
          category: t.category,
          tags: t.tags.length > 0 ? t.tags : t.category ? [t.category] : [],
          date,
          assignedTo: t.defaultAssignee,
          note: encodeNote(t.note, t.animalSpecific),
          done: false,
          sortOrder: t.sortOrder,
        },
      }));
    } catch {
      // Unique (templateId, date) violation — already materialized. Fine.
    }
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const from = searchParams.get("from"); // inclusive
    const to = searchParams.get("to"); // inclusive

    // Caller may request either a single date (default: today) or a
    // from/to range (used by the Upcoming Tasks panel).
    // Admin tasks page: every admin task that's open, plus ones finished in
    // the last 60 days, regardless of which day they were added.
    if (searchParams.get("view") === "admin") {
      const since = new Date(Date.now() - 60 * 86_400_000);
      const rows = await db.taskCompletion.findMany({
        where: {
          AND: [
            { OR: [{ tags: { has: "admin" } }, { category: "admin" }] },
            {
              OR: [
                { done: false },
                { completedAt: { gte: since } },
                { completedAt: null, updatedAt: { gte: since } },
              ],
            },
          ],
        },
        orderBy: [{ createdAt: "asc" }],
      });
      const tasks = rows.map((r) => {
        const { animal, cleanNote } = extractAnimal(r.note);
        return toApi({ ...r, note: cleanNote }, animal);
      });
      return NextResponse.json({ tasks, date: null });
    }

    let where: Record<string, unknown>;
    let viewDate: string | undefined;
    if (from || to) {
      const range: { gte?: string; lte?: string } = {};
      if (from) range.gte = from;
      if (to) range.lte = to;
      // Range views (Upcoming panel) exclude sticky tasks — those are
      // standing items, not scheduled ones.
      where = { date: range, sticky: false };
    } else {
      viewDate = date || todayIso();
      await materializeTemplates(viewDate);
      // "Until done" tasks appear on EVERY day until checked off; once done
      // they only show on their own date.
      where = { OR: [{ date: viewDate }, { sticky: true, done: false }] };
    }

    const rows = await db.taskCompletion.findMany({
      where: where as Parameters<typeof db.taskCompletion.findMany>[0] extends { where?: infer W } ? W : never,
      orderBy: [{ date: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    });
    const tasks = rows.map((r) => {
      const { animal, cleanNote } = extractAnimal(r.note);
      return toApi({ ...r, note: cleanNote }, animal);
    });
    return NextResponse.json({ tasks, date: viewDate ?? null });
  } catch (error) {
    console.error("GET /api/tasks failed:", error);
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { task, block, category, assignedTo, note, animalSpecific, date, templateId, sortOrder, sticky, dueDate, repeat } = body ?? {};

    if (!task || typeof task !== "string") {
      return NextResponse.json({ error: "Missing 'task'" }, { status: 400 });
    }
    if (!block || typeof block !== "string") {
      return NextResponse.json({ error: "Missing 'block'" }, { status: 400 });
    }

    const tags = cleanTags(body?.tags) ?? (category ? [category] : ["routine"]);
    const row = await db.taskCompletion.create({
      data: {
        task,
        block,
        category: tags[0] ?? "routine",
        tags,
        date: date || todayIso(),
        assignedTo: assignedTo || null,
        note: encodeNote(note, animalSpecific),
        done: false,
        templateId: templateId || null,
        sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
        sticky: sticky === true,
        dueDate: isIsoDate(dueDate) ? dueDate : null,
        repeat: cleanRepeat(repeat),
      },
    });
    const { animal, cleanNote } = extractAnimal(row.note);
    return NextResponse.json({ task: toApi({ ...row, note: cleanNote }, animal) }, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks failed:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    // Bulk reorder: { reorder: [{ id, sortOrder, templateId? }], date? }.
    // When an item carries its templateId, the template AND any already-
    // materialized future copies get the same sortOrder in this ONE request
    // (separate fire-and-forget template saves were lost when the app closed
    // right after a drag: client 9/26). Three set-based statements, not one
    // query per task: a 36-task AM list took ~100 round trips and ~48s, long
    // enough to time out, and the client then snapped the moved task back
    // (client 10/22, "Pete's medicine jumps back to the bottom").
    if (Array.isArray(body?.reorder)) {
      const viewDate = typeof body.date === "string" ? body.date : null;
      const items = (body.reorder as unknown[]).filter(
        (i): i is { id: string; sortOrder: number; templateId?: string } =>
          !!i &&
          typeof (i as { id?: unknown }).id === "string" &&
          typeof (i as { sortOrder?: unknown }).sortOrder === "number"
      );
      if (items.length > 0) {
        const ids = items.map((i) => i.id);
        const orders = items.map((i) => Math.round(i.sortOrder));
        await db.$executeRaw`
          UPDATE "TaskCompletion" AS t
          SET "sortOrder" = v.so, "updatedAt" = NOW()
          FROM (SELECT unnest(${ids}::text[]) AS id, unnest(${orders}::int[]) AS so) AS v
          WHERE t.id = v.id`;

        const withTemplate = items.filter((i) => typeof i.templateId === "string" && i.templateId);
        if (withTemplate.length > 0) {
          const tids = withTemplate.map((i) => i.templateId as string);
          const tOrders = withTemplate.map((i) => Math.round(i.sortOrder));
          // Missing (deleted) templates simply match no row.
          await db.$executeRaw`
            UPDATE "TaskTemplate" AS t
            SET "sortOrder" = v.so, "updatedAt" = NOW()
            FROM (SELECT unnest(${tids}::text[]) AS id, unnest(${tOrders}::int[]) AS so) AS v
            WHERE t.id = v.id`;
          if (viewDate) {
            await db.$executeRaw`
              UPDATE "TaskCompletion" AS t
              SET "sortOrder" = v.so, "updatedAt" = NOW()
              FROM (SELECT unnest(${tids}::text[]) AS tid, unnest(${tOrders}::int[]) AS so) AS v
              WHERE t."templateId" = v.tid AND t.date > ${viewDate}`;
          }
        }
      }
      return NextResponse.json({ ok: true });
    }

    const { id, ...updates } = body ?? {};

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Missing 'id'" }, { status: 400 });
    }

    // Build a patch, handling the animalSpecific → note encoding.
    // If either `note` or `animalSpecific` is provided, re-encode.
    const patch: {
      task?: string;
      block?: string;
      category?: string;
      tags?: string[];
      assignedTo?: string | null;
      note?: string | null;
      done?: boolean;
      sortOrder?: number;
      sticky?: boolean;
      outcome?: string;
      outcomeNote?: string;
      dueDate?: string | null;
      repeat?: string | null;
      completedAt?: Date | null;
    } = {};

    if (typeof updates.task === "string") patch.task = updates.task;
    if (typeof updates.block === "string") patch.block = updates.block;
    const patchTags = cleanTags(updates.tags);
    if (patchTags) {
      patch.tags = patchTags;
      patch.category = patchTags[0] ?? "routine";
    } else if (typeof updates.category === "string") {
      patch.category = updates.category;
      patch.tags = [updates.category];
    }
    if (updates.assignedTo !== undefined) patch.assignedTo = updates.assignedTo || null;
    if (typeof updates.done === "boolean") patch.done = updates.done;
    if (typeof updates.sortOrder === "number") patch.sortOrder = updates.sortOrder;
    if (typeof updates.sticky === "boolean") patch.sticky = updates.sticky;
    // Admin-task deadline: a date sets it, null/"" clears it.
    if (updates.dueDate === null || updates.dueDate === "") patch.dueDate = null;
    else if (isIsoDate(updates.dueDate)) patch.dueDate = updates.dueDate;
    if (updates.repeat !== undefined) patch.repeat = cleanRepeat(updates.repeat);
    // Outcome capture: "", "partial", "refused", or "issue" (medical/other
    // concern — client 9/23: "sometimes there is an issue with the medical")
    // + free-text why.
    if (
      updates.outcome === "" ||
      updates.outcome === "partial" ||
      updates.outcome === "refused" ||
      updates.outcome === "issue"
    ) {
      patch.outcome = updates.outcome;
    }
    if (typeof updates.outcomeNote === "string") {
      patch.outcomeNote = updates.outcomeNote.slice(0, 1000);
    }

    // To re-encode note+animal we need the current row.
    if (updates.note !== undefined || updates.animalSpecific !== undefined) {
      const current = await db.taskCompletion.findUnique({ where: { id } });
      if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const { animal: currentAnimal, cleanNote: currentNote } = extractAnimal(current.note);
      const newNote = updates.note !== undefined ? updates.note : currentNote;
      const newAnimal = updates.animalSpecific !== undefined ? updates.animalSpecific : currentAnimal;
      patch.note = encodeNote(newNote, newAnimal);
    }

    // Checking a task off (or un-checking it) changes what happens next for
    // a repeating one, so look at how it was before saving.
    const before =
      patch.done !== undefined ? await db.taskCompletion.findUnique({ where: { id } }) : null;
    if (patch.done !== undefined && before && before.done !== patch.done) {
      patch.completedAt = patch.done ? new Date() : null;
    }

    const row = await db.taskCompletion.update({ where: { id }, data: patch });
    const { animal, cleanNote } = extractAnimal(row.note);

    // Repeating task finished: the next one appears with its due date moved
    // on. Un-checking takes that next one away again (if it isn't done).
    let next: ApiTask | null = null;
    let removedNextIds: string[] = [];
    if (before && row.repeat && before.done !== row.done) {
      try {
        if (row.done) {
          const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Phoenix" });
          const due = nextDue(row.dueDate ?? today, row.repeat, today);
          const existing = await db.taskCompletion.findFirst({ where: { repeatFromId: row.id } });
          const created =
            existing ??
            (await db.taskCompletion.create({
              data: {
                task: row.task,
                block: row.block,
                category: row.category,
                tags: row.tags,
                date: today,
                assignedTo: row.assignedTo,
                note: row.note,
                done: false,
                sortOrder: row.sortOrder,
                sticky: row.sticky,
                dueDate: due,
                repeat: row.repeat,
                repeatFromId: row.id,
              },
            }));
          const parsed = extractAnimal(created.note);
          next = toApi({ ...created, note: parsed.cleanNote }, parsed.animal);
        } else {
          const undone = await db.taskCompletion.findMany({
            where: { repeatFromId: row.id, done: false },
            select: { id: true },
          });
          removedNextIds = undone.map((r) => r.id);
          for (const r of undone) await db.taskCompletion.delete({ where: { id: r.id } });
        }
      } catch (e) {
        console.error("repeat task follow-up failed:", e);
      }
    }

    // A recorded issue on an animal's task also lands on that animal's
    // profile (client 9/23: "can the documented issue also record to the
    // animals profile?"). Kept in sync: editing updates the entry, clearing
    // the outcome removes it. Never fails the task update itself.
    if (patch.outcome !== undefined && animal) {
      try {
        await syncOutcomeToProfile(row.id, animal, row.task, row.date, row.outcome, row.outcomeNote);
      } catch (e) {
        console.error("outcome → profile sync failed:", e);
      }
    }

    return NextResponse.json({ task: toApi({ ...row, note: cleanNote }, animal), next, removedNextIds });
  } catch (error) {
    console.error("PATCH /api/tasks failed:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

// Mirror a task outcome onto the animal's profile as a MedicalEntry
// ("Routine Issue"), linked by sourceTaskId so edits update the same entry
// and clearing the outcome deletes it.
const OUTCOME_LABELS: Record<string, string> = {
  partial: "Partial: started but not finished",
  refused: "Refused",
  issue: "Issue noted",
};

async function syncOutcomeToProfile(
  taskId: string,
  animalName: string,
  taskText: string,
  date: string,
  outcome: string,
  outcomeNote: string
): Promise<void> {
  const existing = await db.medicalEntry.findFirst({ where: { sourceTaskId: taskId } });

  if (!outcome) {
    if (existing) await db.medicalEntry.delete({ where: { id: existing.id } });
    return;
  }

  const animalRow = await db.animal.findFirst({
    where: { name: { equals: animalName, mode: "insensitive" } },
  });
  if (!animalRow) return;

  const label = OUTCOME_LABELS[outcome] ?? outcome;
  const description = outcomeNote ? `${label}. ${outcomeNote}` : label;
  const data = {
    animalId: animalRow.id,
    animalName: animalRow.name,
    type: "Routine Issue",
    title: taskText,
    date,
    description,
    sourceTaskId: taskId,
  };

  if (existing) {
    await db.medicalEntry.update({ where: { id: existing.id }, data });
  } else {
    await db.medicalEntry.create({ data });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing 'id' query param" }, { status: 400 });

    // Deleting a recurring instance records the date on the template's
    // skipDates so the materializer doesn't resurrect it on the next load.
    const row = await db.taskCompletion.findUnique({ where: { id } });
    if (row?.templateId) {
      const template = await db.taskTemplate.findUnique({ where: { id: row.templateId } });
      if (template && !template.skipDates.includes(row.date)) {
        await db.taskTemplate.update({
          where: { id: template.id },
          data: { skipDates: [...template.skipDates, row.date] },
        });
      }
    }

    await db.taskCompletion.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/tasks failed:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
