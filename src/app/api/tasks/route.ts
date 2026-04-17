import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Server shape matches the ScheduleTask UI shape closely, plus `id` and `block`
// so the client can group tasks into blocks.
interface ApiTask {
  id: string;
  task: string;
  block: string;           // "AM" | "Mid" | "PM"
  category: string;
  date: string;            // ISO YYYY-MM-DD
  assignedTo: string | null;
  done: boolean;
  note: string | null;
  animalSpecific: string | null;
  templateId: string | null;
  createdAt: string;
}

function toApi(row: {
  id: string;
  task: string;
  block: string;
  category: string;
  date: string;
  assignedTo: string | null;
  done: boolean;
  note: string | null;
  templateId: string | null;
  createdAt: Date;
}, animalSpecific: string | null): ApiTask {
  return {
    id: row.id,
    task: row.task,
    block: row.block,
    category: row.category,
    date: row.date,
    assignedTo: row.assignedTo,
    done: row.done,
    note: row.note,
    animalSpecific,
    templateId: row.templateId,
    createdAt: row.createdAt.toISOString(),
  };
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || todayIso();

    const rows = await db.taskCompletion.findMany({
      where: { date },
      orderBy: { createdAt: "asc" },
    });
    const tasks = rows.map((r) => {
      const { animal, cleanNote } = extractAnimal(r.note);
      return toApi({ ...r, note: cleanNote }, animal);
    });
    return NextResponse.json({ tasks, date });
  } catch (error) {
    console.error("GET /api/tasks failed:", error);
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { task, block, category, assignedTo, note, animalSpecific, date, templateId } = body ?? {};

    if (!task || typeof task !== "string") {
      return NextResponse.json({ error: "Missing 'task'" }, { status: 400 });
    }
    if (!block || typeof block !== "string") {
      return NextResponse.json({ error: "Missing 'block'" }, { status: 400 });
    }

    const row = await db.taskCompletion.create({
      data: {
        task,
        block,
        category: category || "routine",
        date: date || todayIso(),
        assignedTo: assignedTo || null,
        note: encodeNote(note, animalSpecific),
        done: false,
        templateId: templateId || null,
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
      assignedTo?: string | null;
      note?: string | null;
      done?: boolean;
    } = {};

    if (typeof updates.task === "string") patch.task = updates.task;
    if (typeof updates.block === "string") patch.block = updates.block;
    if (typeof updates.category === "string") patch.category = updates.category;
    if (updates.assignedTo !== undefined) patch.assignedTo = updates.assignedTo || null;
    if (typeof updates.done === "boolean") patch.done = updates.done;

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

    await db.taskCompletion.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/tasks failed:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
