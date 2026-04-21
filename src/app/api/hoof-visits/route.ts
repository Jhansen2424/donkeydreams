import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Hoof trim visits. Each POST may optionally also update the animal's
// `nextHoofDue` date — so the Daily Routine/Hoof dashboard can bump the
// schedule in one call. A PATCH with no `id` but with `nextHoofDue` and
// `animal` just updates the next-due date without creating a visit (used
// by Joshy's "set_hoof_date" action).

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
    const rows = await db.hoofVisit.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 2000,
    });

    // Also return per-animal next-due dates when no animal filter is set so
    // the hoof-dental page can render everything in one fetch.
    const animals = animal
      ? await db.animal.findMany({ where: { name: animal }, select: { name: true, nextHoofDue: true } })
      : await db.animal.findMany({ select: { name: true, nextHoofDue: true } });

    const nextDue: Record<string, string | null> = {};
    for (const a of animals) nextDue[a.name] = a.nextHoofDue ?? null;

    return NextResponse.json({ entries: rows.map(toApi), nextDue });
  } catch (error) {
    console.error("GET /api/hoof-visits failed:", error);
    return NextResponse.json({ error: "Failed to load hoof visits" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { animal, date, provider, notes, nextHoofDue } = body ?? {};

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

    const row = await db.hoofVisit.create({
      data: {
        animalId: animalRow.id,
        animalName: animalRow.name,
        date,
        provider: typeof provider === "string" ? provider : "",
        notes: typeof notes === "string" ? notes : "",
      },
    });

    if (typeof nextHoofDue === "string" && nextHoofDue.length > 0) {
      await db.animal.update({
        where: { id: animalRow.id },
        data: { nextHoofDue },
      });
    }

    return NextResponse.json({ entry: toApi(row) }, { status: 201 });
  } catch (error) {
    console.error("POST /api/hoof-visits failed:", error);
    return NextResponse.json({ error: "Failed to save hoof visit" }, { status: 500 });
  }
}

// Two modes:
//  1. `id` provided → edit an existing HoofVisit (date/provider/notes).
//  2. `animal` + `nextHoofDue` provided (no id) → update only the animal's
//     next-due date. This is what Joshy's set_hoof_date action hits.
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, animal, date, provider, notes, nextHoofDue } = body ?? {};

    if (id && typeof id === "string") {
      const update: Record<string, unknown> = {};
      if (typeof date === "string") update.date = date;
      if (typeof provider === "string") update.provider = provider;
      if (typeof notes === "string") update.notes = notes;
      const row = await db.hoofVisit.update({
        where: { id },
        data: update as Parameters<typeof db.hoofVisit.update>[0]["data"],
      });

      if (typeof nextHoofDue === "string" && nextHoofDue.length > 0) {
        await db.animal.update({
          where: { id: row.animalId },
          data: { nextHoofDue },
        });
      }
      return NextResponse.json({ entry: toApi(row) });
    }

    if (typeof animal === "string" && typeof nextHoofDue === "string") {
      const animalRow = await resolveAnimalByName(animal);
      if (!animalRow) {
        return NextResponse.json({ error: `Unknown animal '${animal}'` }, { status: 400 });
      }
      await db.animal.update({
        where: { id: animalRow.id },
        data: { nextHoofDue: nextHoofDue || null },
      });
      return NextResponse.json({ animal: animalRow.name, nextHoofDue });
    }

    return NextResponse.json(
      { error: "Provide either 'id' (edit visit) or 'animal' + 'nextHoofDue' (set next-due)" },
      { status: 400 }
    );
  } catch (error) {
    console.error("PATCH /api/hoof-visits failed:", error);
    return NextResponse.json({ error: "Failed to update hoof visit" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing 'id' query param" }, { status: 400 });
    await db.hoofVisit.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/hoof-visits failed:", error);
    return NextResponse.json({ error: "Failed to delete hoof visit" }, { status: 500 });
  }
}
