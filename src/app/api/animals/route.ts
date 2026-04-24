import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Animal create + update endpoint.
//
// PATCH whitelists fields callers are allowed to touch. Identity/CSV-owned
// fields (id, name, slug, age, sex, origin, intakeDate, birthDate, color,
// size, microchip) are intentionally NOT editable here — those come from
// the adoption CSV and must not be overwritten by the app.
//
// POST creates a brand-new animal (used by the +New Animal button when
// staff intake a donkey that isn't in the CSV). All identity fields are
// settable here since the row doesn't exist yet.

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\s-]+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, herd, sex, age, origin, intakeDate, color, size } = body ?? {};
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Missing 'name'" }, { status: 400 });
    }
    if (!herd || typeof herd !== "string") {
      return NextResponse.json({ error: "Missing 'herd'" }, { status: 400 });
    }

    // Check for duplicate name (case-sensitive — the CSV name is the unique key)
    const existing = await db.animal.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json(
        { error: `An animal named '${name}' already exists.` },
        { status: 409 }
      );
    }

    const row = await db.animal.create({
      data: {
        name,
        slug: slugify(name),
        herd,
        sex: typeof sex === "string" ? sex : "Jenny",
        age: typeof age === "string" ? age : "Unknown",
        origin: typeof origin === "string" ? origin : "",
        intakeDate: typeof intakeDate === "string" ? intakeDate : "",
        pen: "",
      },
    });
    return NextResponse.json({ animal: row }, { status: 201 });
  } catch (error) {
    console.error("POST /api/animals failed:", error);
    return NextResponse.json({ error: "Failed to create animal" }, { status: 500 });
  }
}

const EDITABLE: Array<
  | "galleryImages"
  | "bestFriends"
  | "behavioralNotes"
  | "status"
  | "herd"
  | "pen"
  | "tagline"
  | "traits"
  | "story"
  | "sponsorable"
  | "profileImage"
  | "adoptedFrom"
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
  "story",
  "sponsorable",
  "profileImage",
  "adoptedFrom",
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
