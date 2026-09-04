import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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
    createdAt: row.createdAt.toISOString(),
  };
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

  for (const t of templates) {
    if (t.repeatDays.length > 0 && !t.repeatDays.includes(weekday)) continue;
    if (t.skipDates.includes(date)) continue;
    try {
      await db.taskCompletion.create({
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
      });
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
    const { task, block, category, assignedTo, note, animalSpecific, date, templateId, sortOrder, sticky } = body ?? {};

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

    // Bulk reorder: { reorder: [{ id, sortOrder }, ...] }. Sequential awaits —
    // the Neon HTTP adapter does not support transactions.
    if (Array.isArray(body?.reorder)) {
      for (const item of body.reorder) {
        if (!item || typeof item.id !== "string" || typeof item.sortOrder !== "number") continue;
        await db.taskCompletion.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        });
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

    // To re-encode note+animal we need the current row.
    if (updates.note !== undefined || updates.animalSpecific !== undefined) {
      const current = await db.taskCompletion.findUnique({ where: { id } });
      if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const { animal: currentAnimal, cleanNote: currentNote } = extractAnimal(current.note);
      const newNote = updates.note !== undefined ? updates.note : currentNote;
      const newAnimal = updates.animalSpecific !== undefined ? updates.animalSpecific : currentAnimal;
      patch.note = encodeNote(newNote, newAnimal);
    }

    const row = await db.taskCompletion.update({ where: { id }, data: patch });
    const { animal, cleanNote } = extractAnimal(row.note);
    return NextResponse.json({ task: toApi({ ...row, note: cleanNote }, animal) });
  } catch (error) {
    console.error("PATCH /api/tasks failed:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
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
