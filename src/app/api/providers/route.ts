import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Provider CRUD (farriers, equine dentists, vets). Identity = unique `name`.
// Shape mirrors the legacy in-memory seed in `@/lib/hoof-dental-data` so
// components don't need a translation layer.

interface ApiProvider {
  id: string;
  name: string;
  type: string;
  phone: string;
  notes: string;
}

function toApi(row: {
  id: string;
  name: string;
  type: string;
  phone: string;
  notes: string;
}): ApiProvider {
  return row;
}

export async function GET() {
  try {
    const rows = await db.provider.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json({ providers: rows.map(toApi) });
  } catch (error) {
    console.error("GET /api/providers failed:", error);
    return NextResponse.json({ error: "Failed to load providers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, type, phone, notes } = body ?? {};
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Missing 'name'" }, { status: 400 });
    }
    if (!type || typeof type !== "string") {
      return NextResponse.json({ error: "Missing 'type'" }, { status: 400 });
    }
    // Upsert on unique name so re-adding the same provider just updates it.
    const row = await db.provider.upsert({
      where: { name },
      update: {
        type,
        phone: typeof phone === "string" ? phone : "",
        notes: typeof notes === "string" ? notes : "",
      },
      create: {
        name,
        type,
        phone: typeof phone === "string" ? phone : "",
        notes: typeof notes === "string" ? notes : "",
      },
    });
    return NextResponse.json({ provider: toApi(row) }, { status: 201 });
  } catch (error) {
    console.error("POST /api/providers failed:", error);
    return NextResponse.json({ error: "Failed to save provider" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, type, phone, notes } = body ?? {};
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Missing 'id'" }, { status: 400 });
    }
    const update: Record<string, unknown> = {};
    if (typeof name === "string") update.name = name;
    if (typeof type === "string") update.type = type;
    if (typeof phone === "string") update.phone = phone;
    if (typeof notes === "string") update.notes = notes;
    const row = await db.provider.update({
      where: { id },
      data: update as Parameters<typeof db.provider.update>[0]["data"],
    });
    return NextResponse.json({ provider: toApi(row) });
  } catch (error) {
    console.error("PATCH /api/providers failed:", error);
    return NextResponse.json({ error: "Failed to update provider" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const name = searchParams.get("name");
    if (!id && !name) {
      return NextResponse.json(
        { error: "Missing 'id' or 'name' query param" },
        { status: 400 }
      );
    }
    const where = id ? { id } : { name: name! };
    await db.provider.delete({ where });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/providers failed:", error);
    return NextResponse.json({ error: "Failed to delete provider" }, { status: 500 });
  }
}
