import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Dental visits — mirrors /api/hoof-visits. See that file for the API
// contract (two PATCH modes, GET returns per-animal nextDentalDue, etc.).

interface ApiVisit {
  id: string;
  animal: string;
  date: string;
  provider: string;
  notes: string;
}

function toApi(row: {
  id: string;
  animalName: string;
  date: string;
  provider: string | null;
  notes: string | null;
}): ApiVisit {
  return {
    id: row.id,
    animal: row.animalName,
    date: row.date,
    provider: row.provider ?? "",
    notes: row.notes ?? "",
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
    const rows = await db.dentalVisit.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 2000,
    });

    const animals = animal
      ? await db.animal.findMany({ where: { name: animal }, select: { name: true, nextDentalDue: true } })
      : await db.animal.findMany({ select: { name: true, nextDentalDue: true } });

    const nextDue: Record<string, string | null> = {};
    for (const a of animals) nextDue[a.name] = a.nextDentalDue ?? null;

    return NextResponse.json({ entries: rows.map(toApi), nextDue });
  } catch (error) {
    console.error("GET /api/dental-visits failed:", error);
    return NextResponse.json({ error: "Failed to load dental visits" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { animal, date, provider, notes, nextDentalDue } = body ?? {};

    if (!animal || typeof animal !== "string") {
      return NextResponse.json({ error: "Missing 'animal'" }, { status: 400 });
    }
    if (!date || typeof date !== "string") {
      return NextResponse.json({ error: "Missing 'date'" }, { status: 400 });
    }

    const animalRow = await resolveAnimalByName(animal);
    if (!animalRow) {
      return NextResponse.json({ error: `Unknown animal '${animal}'` }, { status: 400 });
    }

    const row = await db.dentalVisit.create({
      data: {
        animalId: animalRow.id,
        animalName: animalRow.name,
        date,
        provider: typeof provider === "string" ? provider : "",
        notes: typeof notes === "string" ? notes : "",
      },
    });

    if (typeof nextDentalDue === "string" && nextDentalDue.length > 0) {
      await db.animal.update({
        where: { id: animalRow.id },
        data: { nextDentalDue },
      });
    }

    return NextResponse.json({ entry: toApi(row) }, { status: 201 });
  } catch (error) {
    console.error("POST /api/dental-visits failed:", error);
    return NextResponse.json({ error: "Failed to save dental visit" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, animal, date, provider, notes, nextDentalDue } = body ?? {};

    if (id && typeof id === "string") {
      const update: Record<string, unknown> = {};
      if (typeof date === "string") update.date = date;
      if (typeof provider === "string") update.provider = provider;
      if (typeof notes === "string") update.notes = notes;
      const row = await db.dentalVisit.update({
        where: { id },
        data: update as Parameters<typeof db.dentalVisit.update>[0]["data"],
      });

      if (typeof nextDentalDue === "string" && nextDentalDue.length > 0) {
        await db.animal.update({
          where: { id: row.animalId },
          data: { nextDentalDue },
        });
      }
      return NextResponse.json({ entry: toApi(row) });
    }

    if (typeof animal === "string" && typeof nextDentalDue === "string") {
      const animalRow = await resolveAnimalByName(animal);
      if (!animalRow) {
        return NextResponse.json({ error: `Unknown animal '${animal}'` }, { status: 400 });
      }
      await db.animal.update({
        where: { id: animalRow.id },
        data: { nextDentalDue: nextDentalDue || null },
      });
      return NextResponse.json({ animal: animalRow.name, nextDentalDue });
    }

    return NextResponse.json(
      { error: "Provide either 'id' (edit visit) or 'animal' + 'nextDentalDue' (set next-due)" },
      { status: 400 }
    );
  } catch (error) {
    console.error("PATCH /api/dental-visits failed:", error);
    return NextResponse.json({ error: "Failed to update dental visit" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing 'id' query param" }, { status: 400 });
    await db.dentalVisit.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/dental-visits failed:", error);
    return NextResponse.json({ error: "Failed to delete dental visit" }, { status: 500 });
  }
}
