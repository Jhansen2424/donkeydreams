import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// API entry shape mirrors `MedicalEntry` in `@/lib/medical-data` so the client
// context can consume it without translation.
interface ApiEntry {
  id: string;
  animal: string;
  type: string;
  title: string;
  date: string;
  description: string;
  urgent: boolean;
  provider: string;
}

function toApi(row: {
  id: string;
  animalName: string;
  type: string;
  title: string;
  date: string;
  description: string;
  urgent: boolean;
  provider?: string | null;
}): ApiEntry {
  return {
    id: row.id,
    animal: row.animalName,
    type: row.type,
    title: row.title,
    date: row.date,
    description: row.description,
    urgent: row.urgent,
    provider: row.provider ?? "",
  };
}

// Animal lookup is by unique `name` — same field the UI already carries around.
async function resolveAnimalByName(name: string) {
  return db.animal.findUnique({ where: { name } });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const animalName = searchParams.get("animal");
    const type = searchParams.get("type");

    const where: Record<string, unknown> = {};
    if (animalName) where.animalName = animalName;
    if (type) where.type = type;

    const rows = await db.medicalEntry.findMany({
      where: where as Parameters<typeof db.medicalEntry.findMany>[0] extends { where?: infer W } ? W : never,
      orderBy: { date: "desc" },
      take: 2000,
    });
    return NextResponse.json({ entries: rows.map(toApi) });
  } catch (error) {
    console.error("GET /api/medical failed:", error);
    return NextResponse.json({ error: "Failed to load medical entries" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { animal, type, title, date, description, urgent, provider } = body ?? {};

    if (!animal || typeof animal !== "string") {
      return NextResponse.json({ error: "Missing 'animal'" }, { status: 400 });
    }
    if (!type || typeof type !== "string") {
      return NextResponse.json({ error: "Missing 'type'" }, { status: 400 });
    }
    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Missing 'title'" }, { status: 400 });
    }
    if (!date || typeof date !== "string") {
      return NextResponse.json({ error: "Missing 'date'" }, { status: 400 });
    }

    const animalRow = await resolveAnimalByName(animal);
    if (!animalRow) {
      return NextResponse.json({ error: `Unknown animal '${animal}'` }, { status: 400 });
    }

    const row = await db.medicalEntry.create({
      data: {
        animalId: animalRow.id,
        animalName: animalRow.name,
        type,
        title,
        date,
        description: typeof description === "string" ? description : "",
        urgent: Boolean(urgent),
        provider: typeof provider === "string" ? provider : "",
      },
    });
    return NextResponse.json({ entry: toApi(row) }, { status: 201 });
  } catch (error) {
    console.error("POST /api/medical failed:", error);
    return NextResponse.json({ error: "Failed to create medical entry" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, type, title, date, description, urgent, animal, provider } = body ?? {};

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Missing 'id'" }, { status: 400 });
    }

    const update: Record<string, unknown> = {};
    if (typeof type === "string" && type.length > 0) update.type = type;
    if (typeof title === "string" && title.length > 0) update.title = title;
    if (typeof date === "string" && date.length > 0) update.date = date;
    if (typeof description === "string") update.description = description;
    if (typeof urgent === "boolean") update.urgent = urgent;
    if (typeof provider === "string") update.provider = provider;
    if (typeof animal === "string" && animal.length > 0) {
      const animalRow = await resolveAnimalByName(animal);
      if (!animalRow) {
        return NextResponse.json({ error: `Unknown animal '${animal}'` }, { status: 400 });
      }
      update.animalId = animalRow.id;
      update.animalName = animalRow.name;
    }

    const row = await db.medicalEntry.update({
      where: { id },
      data: update as Parameters<typeof db.medicalEntry.update>[0]["data"],
    });
    return NextResponse.json({ entry: toApi(row) });
  } catch (error) {
    console.error("PATCH /api/medical failed:", error);
    return NextResponse.json({ error: "Failed to update medical entry" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing 'id' query param" }, { status: 400 });
    }

    await db.medicalEntry.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/medical failed:", error);
    return NextResponse.json({ error: "Failed to delete medical entry" }, { status: 500 });
  }
}
