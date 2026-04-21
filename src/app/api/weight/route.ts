import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// WeighIn entries carry a weight, a BCS (body-condition score 1-9), or
// both. At least one must be present. BCS is the numeric Henneke-adapted
// donkey score — the weight page already renders it.

interface ApiWeighIn {
  id: string;
  animal: string;
  date: string;
  weight: number | null;
  bcs: number | null;
  notes: string;
  recordedBy: string;
}

function toApi(row: {
  id: string;
  animalName: string;
  date: string;
  weight: number | null;
  bcs: number | null;
  notes: string | null;
  recordedBy: string | null;
}): ApiWeighIn {
  return {
    id: row.id,
    animal: row.animalName,
    date: row.date,
    weight: row.weight,
    bcs: row.bcs,
    notes: row.notes ?? "",
    recordedBy: row.recordedBy ?? "",
  };
}

async function resolveAnimalByName(name: string) {
  return db.animal.findUnique({ where: { name } });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const animal = searchParams.get("animal");
    const where = animal ? { animalName: animal } : {};
    const rows = await db.weighIn.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 2000,
    });
    return NextResponse.json({ entries: rows.map(toApi) });
  } catch (error) {
    console.error("GET /api/weight failed:", error);
    return NextResponse.json({ error: "Failed to load weigh-ins" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { animal, date, weight, bcs, notes, recordedBy } = body ?? {};

    if (!animal || typeof animal !== "string") {
      return NextResponse.json({ error: "Missing 'animal'" }, { status: 400 });
    }
    if (!date || typeof date !== "string") {
      return NextResponse.json({ error: "Missing 'date'" }, { status: 400 });
    }
    const hasWeight = typeof weight === "number" && Number.isFinite(weight);
    const hasBcs = typeof bcs === "number" && Number.isInteger(bcs) && bcs >= 1 && bcs <= 9;
    if (!hasWeight && !hasBcs) {
      return NextResponse.json(
        { error: "Provide weight (lbs) and/or bcs (1-9)" },
        { status: 400 }
      );
    }

    const animalRow = await resolveAnimalByName(animal);
    if (!animalRow) {
      return NextResponse.json({ error: `Unknown animal '${animal}'` }, { status: 400 });
    }

    const row = await db.weighIn.create({
      data: {
        animalId: animalRow.id,
        animalName: animalRow.name,
        date,
        weight: hasWeight ? weight : null,
        bcs: hasBcs ? bcs : null,
        notes: typeof notes === "string" ? notes : "",
        recordedBy: typeof recordedBy === "string" ? recordedBy : "",
      },
    });
    return NextResponse.json({ entry: toApi(row) }, { status: 201 });
  } catch (error) {
    console.error("POST /api/weight failed:", error);
    return NextResponse.json({ error: "Failed to save weigh-in" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, date, weight, bcs, notes, recordedBy } = body ?? {};
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Missing 'id'" }, { status: 400 });
    }
    const update: Record<string, unknown> = {};
    if (typeof date === "string" && date) update.date = date;
    if (typeof weight === "number" || weight === null) update.weight = weight;
    if (typeof bcs === "number" || bcs === null) update.bcs = bcs;
    if (typeof notes === "string") update.notes = notes;
    if (typeof recordedBy === "string") update.recordedBy = recordedBy;

    const row = await db.weighIn.update({
      where: { id },
      data: update as Parameters<typeof db.weighIn.update>[0]["data"],
    });
    return NextResponse.json({ entry: toApi(row) });
  } catch (error) {
    console.error("PATCH /api/weight failed:", error);
    return NextResponse.json({ error: "Failed to update weigh-in" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing 'id' query param" }, { status: 400 });
    await db.weighIn.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/weight failed:", error);
    return NextResponse.json({ error: "Failed to delete weigh-in" }, { status: 500 });
  }
}
