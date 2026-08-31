import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Recurring routine templates. Active templates are materialized into
// per-day TaskCompletion rows by GET /api/tasks — this route only manages
// the templates themselves.

interface ApiTemplate {
  id: string;
  task: string;
  block: string;
  category: string;
  animalSpecific: string | null;
  defaultAssignee: string | null;
  note: string | null;
  active: boolean;
  repeatDays: number[];
  sortOrder: number;
}

function toApi(row: {
  id: string;
  task: string;
  block: string;
  category: string;
  animalSpecific: string | null;
  defaultAssignee: string | null;
  note: string | null;
  active: boolean;
  repeatDays: number[];
  sortOrder: number;
}): ApiTemplate {
  return {
    id: row.id,
    task: row.task,
    block: row.block,
    category: row.category,
    animalSpecific: row.animalSpecific,
    defaultAssignee: row.defaultAssignee,
    note: row.note,
    active: row.active,
    repeatDays: row.repeatDays,
    sortOrder: row.sortOrder,
  };
}

function cleanRepeatDays(v: unknown): number[] {
  if (!Array.isArray(v)) return [];
  return v.filter((d): d is number => typeof d === "number" && d >= 0 && d <= 6);
}

export async function GET() {
  try {
    const rows = await db.taskTemplate.findMany({
      orderBy: [{ block: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({ templates: rows.map(toApi) });
  } catch (error) {
    console.error("GET /api/tasks/templates failed:", error);
    return NextResponse.json({ error: "Failed to load templates" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { task, block, category, animalSpecific, assignedTo, note, repeatDays, sortOrder } = body ?? {};
    if (!task || typeof task !== "string") {
      return NextResponse.json({ error: "Missing 'task'" }, { status: 400 });
    }
    if (!block || typeof block !== "string") {
      return NextResponse.json({ error: "Missing 'block'" }, { status: 400 });
    }

    const row = await db.taskTemplate.create({
      data: {
        task,
        block,
        category: typeof category === "string" ? category : "routine",
        animalSpecific: typeof animalSpecific === "string" && animalSpecific ? animalSpecific : null,
        defaultAssignee: typeof assignedTo === "string" && assignedTo ? assignedTo : null,
        note: typeof note === "string" && note ? note : null,
        repeatDays: cleanRepeatDays(repeatDays),
        sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
      },
    });
    return NextResponse.json({ template: toApi(row) }, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks/templates failed:", error);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body ?? {};
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Missing 'id'" }, { status: 400 });
    }

    const patch: Record<string, unknown> = {};
    if (typeof updates.task === "string") patch.task = updates.task;
    if (typeof updates.block === "string") patch.block = updates.block;
    if (typeof updates.category === "string") patch.category = updates.category;
    if (updates.animalSpecific !== undefined) patch.animalSpecific = updates.animalSpecific || null;
    if (updates.assignedTo !== undefined) patch.defaultAssignee = updates.assignedTo || null;
    if (updates.note !== undefined) patch.note = updates.note || null;
    if (typeof updates.active === "boolean") patch.active = updates.active;
    if (updates.repeatDays !== undefined) patch.repeatDays = cleanRepeatDays(updates.repeatDays);
    if (typeof updates.sortOrder === "number") patch.sortOrder = updates.sortOrder;
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "No editable fields in payload" }, { status: 400 });
    }

    const row = await db.taskTemplate.update({
      where: { id },
      data: patch as Parameters<typeof db.taskTemplate.update>[0]["data"],
    });
    return NextResponse.json({ template: toApi(row) });
  } catch (error) {
    console.error("PATCH /api/tasks/templates failed:", error);
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing 'id' query param" }, { status: 400 });

    await db.taskTemplate.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/tasks/templates failed:", error);
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }
}
