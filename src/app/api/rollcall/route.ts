import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Roll Call: one Sighting row per donkey per day they were laid eyes on.
//
// GET ?date=YYYY-MM-DD → { seen: string[], lastSeen: Record<name, date> }
//   `seen` is who's been marked for that day; `lastSeen` is each donkey's
//   most recent sighting date ever (drives the 48-hour alert).
// POST { animal, date, seenBy? } → mark seen (idempotent).
// DELETE ?animal=&date= → unmark.

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    if (!date) {
      return NextResponse.json({ error: "Missing 'date' query param" }, { status: 400 });
    }

    const todayRows = await db.sighting.findMany({
      where: { date },
      select: { animalName: true },
    });
    const grouped = await db.sighting.groupBy({
      by: ["animalName"],
      _max: { date: true },
    });
    const lastSeen: Record<string, string> = {};
    for (const g of grouped) {
      if (g._max.date) lastSeen[g.animalName] = g._max.date;
    }
    return NextResponse.json({
      seen: todayRows.map((r) => r.animalName),
      lastSeen,
    });
  } catch (error) {
    console.error("GET /api/rollcall failed:", error);
    return NextResponse.json({ error: "Failed to load roll call" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { animal, date, seenBy } = body ?? {};
    if (!animal || typeof animal !== "string") {
      return NextResponse.json({ error: "Missing 'animal'" }, { status: 400 });
    }
    if (!date || typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Missing or invalid 'date'" }, { status: 400 });
    }
    try {
      await db.sighting.create({
        data: {
          animalName: animal,
          date,
          seenBy: typeof seenBy === "string" ? seenBy : "",
        },
      });
    } catch {
      // Unique (animalName, date) violation — already marked. Fine.
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/rollcall failed:", error);
    return NextResponse.json({ error: "Failed to record sighting" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const animal = searchParams.get("animal");
    const date = searchParams.get("date");
    if (!animal || !date) {
      return NextResponse.json({ error: "Missing 'animal' or 'date'" }, { status: 400 });
    }
    await db.sighting.deleteMany({ where: { animalName: animal, date } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/rollcall failed:", error);
    return NextResponse.json({ error: "Failed to remove sighting" }, { status: 500 });
  }
}
