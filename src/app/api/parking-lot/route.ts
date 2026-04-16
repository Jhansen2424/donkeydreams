import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Shape returned to clients matches the in-memory ParkingLotEntry so the
// context can consume it without translation. `timestamp` is an ISO string.
interface ApiEntry {
  id: string;
  type: string;
  text: string;
  timestamp: string;
  resolved: boolean;
  data?: Record<string, unknown>;
}

function toApi(row: {
  id: string;
  type: string;
  text: string;
  createdAt: Date;
  resolved: boolean;
  data: unknown;
}): ApiEntry {
  return {
    id: row.id,
    type: row.type,
    text: row.text,
    timestamp: row.createdAt.toISOString(),
    resolved: row.resolved,
    data: (row.data as Record<string, unknown>) ?? undefined,
  };
}

export async function GET() {
  try {
    const rows = await db.parkingLotEntry.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    return NextResponse.json({ entries: rows.map(toApi) });
  } catch (error) {
    console.error("GET /api/parking-lot failed:", error);
    return NextResponse.json({ error: "Failed to load notes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, text, data } = body ?? {};

    if (!type || typeof type !== "string") {
      return NextResponse.json({ error: "Missing 'type'" }, { status: 400 });
    }
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing 'text'" }, { status: 400 });
    }

    const row = await db.parkingLotEntry.create({
      data: {
        type,
        text,
        data: data ?? undefined,
        resolved: false,
      },
    });
    return NextResponse.json({ entry: toApi(row) }, { status: 201 });
  } catch (error) {
    console.error("POST /api/parking-lot failed:", error);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, resolved } = body ?? {};

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Missing 'id'" }, { status: 400 });
    }

    const row = await db.parkingLotEntry.update({
      where: { id },
      data: { resolved: typeof resolved === "boolean" ? resolved : undefined },
    });
    return NextResponse.json({ entry: toApi(row) });
  } catch (error) {
    console.error("PATCH /api/parking-lot failed:", error);
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing 'id' query param" }, { status: 400 });
    }

    await db.parkingLotEntry.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/parking-lot failed:", error);
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
