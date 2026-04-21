import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Minimal Animal update endpoint. Currently supports the fields the UI
// actually edits: galleryImages (photo URLs), bestFriends (relationships),
// behavioralNotes, status, herd, pen. Add more as needed — we intentionally
// keep the whitelist narrow so callers can't write unexpected fields.

const EDITABLE: Array<
  | "galleryImages"
  | "bestFriends"
  | "behavioralNotes"
  | "status"
  | "herd"
  | "pen"
  | "tagline"
  | "traits"
  | "nextHoofDue"
  | "nextDentalDue"
> = [
  "galleryImages",
  "bestFriends",
  "behavioralNotes",
  "status",
  "herd",
  "pen",
  "tagline",
  "traits",
  "nextHoofDue",
  "nextDentalDue",
];

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, ...rest } = body ?? {};
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Missing 'name'" }, { status: 400 });
    }

    const update: Record<string, unknown> = {};
    for (const key of EDITABLE) {
      if (rest[key] !== undefined) update[key] = rest[key];
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No editable fields in payload" }, { status: 400 });
    }

    const row = await db.animal.update({
      where: { name },
      data: update as Parameters<typeof db.animal.update>[0]["data"],
    });
    return NextResponse.json({ animal: row });
  } catch (error) {
    console.error("PATCH /api/animals failed:", error);
    return NextResponse.json({ error: "Failed to update animal" }, { status: 500 });
  }
}
