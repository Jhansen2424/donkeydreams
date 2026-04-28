import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Per-donkey overrides for the trim profile fields normally sourced from
// donkey-trimming-notes.csv. Stored separately so a CSV re-import doesn't
// blow away staff edits. The animal profile page fetches these and merges:
// override > CSV.

interface ApiOverride {
  animalName: string;
  preTrimTreatment: string | null;
  protocols: string | null;
  squishPads: string | null;
  recentNotes: string | null;
  trainingNotes: string | null;
}

function toApi(row: {
  animalName: string;
  preTrimTreatment: string | null;
  protocols: string | null;
  squishPads: string | null;
  recentNotes: string | null;
  trainingNotes: string | null;
}): ApiOverride {
  return row;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const animal = searchParams.get("animal");
    if (animal) {
      const row = await db.trimProfileOverride.findUnique({
        where: { animalName: animal },
      });
      return NextResponse.json({ override: row ? toApi(row) : null });
    }
    const rows = await db.trimProfileOverride.findMany();
    return NextResponse.json({ overrides: rows.map(toApi) });
  } catch (error) {
    console.error("GET /api/trim-profiles failed:", error);
    return NextResponse.json(
      { error: "Failed to load trim profile overrides" },
      { status: 500 }
    );
  }
}

// Single endpoint for create+update — staff edits via the animal profile
// page either start a new override or update the existing one. Body:
// { animal, preTrimTreatment?, protocols?, squishPads?, recentNotes?,
//   trainingNotes? }. Any field set to "" will clear the override and
// fall back to the CSV value.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { animal, ...fields } = body ?? {};
    if (!animal || typeof animal !== "string") {
      return NextResponse.json({ error: "Missing 'animal'" }, { status: 400 });
    }
    const update: Record<string, string | null> = {};
    for (const f of [
      "preTrimTreatment",
      "protocols",
      "squishPads",
      "recentNotes",
      "trainingNotes",
    ] as const) {
      if (f in fields) {
        const v = fields[f];
        update[f] = typeof v === "string" ? v : null;
      }
    }
    const row = await db.trimProfileOverride.upsert({
      where: { animalName: animal },
      create: {
        animalName: animal,
        ...update,
      } as Parameters<typeof db.trimProfileOverride.create>[0]["data"],
      update: update as Parameters<
        typeof db.trimProfileOverride.update
      >[0]["data"],
    });
    return NextResponse.json({ override: toApi(row) }, { status: 201 });
  } catch (error) {
    console.error("POST /api/trim-profiles failed:", error);
    return NextResponse.json(
      { error: "Failed to save trim profile override" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const animal = searchParams.get("animal");
    if (!animal) {
      return NextResponse.json(
        { error: "Missing 'animal' query param" },
        { status: 400 }
      );
    }
    await db.trimProfileOverride.delete({ where: { animalName: animal } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/trim-profiles failed:", error);
    return NextResponse.json(
      { error: "Failed to delete trim profile override" },
      { status: 500 }
    );
  }
}
