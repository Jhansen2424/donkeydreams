import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Map pen CRUD. A pen is a GeoJSON Polygon plus name/herd/notes metadata.
// Multiple pens per herd are allowed. The polygon is stored as Json so we
// don't lock ourselves into PostGIS for what is, in practice, < 100 rows.

interface ApiPen {
  id: string;
  name: string;
  herd: string;
  polygon: unknown; // GeoJSON Polygon
  notes: string;
}

function toApi(row: {
  id: string;
  name: string;
  herd: string;
  polygon: unknown;
  notes: string;
}): ApiPen {
  return {
    id: row.id,
    name: row.name,
    herd: row.herd,
    polygon: row.polygon,
    notes: row.notes ?? "",
  };
}

// Minimum sanity check on a GeoJSON Polygon. Doesn't catch every degenerate
// case but rejects the obvious garbage (wrong type, < 4 points, not nested
// arrays of [lng, lat] pairs).
function isValidPolygon(p: unknown): boolean {
  if (!p || typeof p !== "object") return false;
  const poly = p as { type?: string; coordinates?: unknown };
  if (poly.type !== "Polygon") return false;
  if (!Array.isArray(poly.coordinates) || poly.coordinates.length === 0) return false;
  const ring = poly.coordinates[0];
  if (!Array.isArray(ring) || ring.length < 4) return false;
  for (const pt of ring) {
    if (!Array.isArray(pt) || pt.length < 2) return false;
    if (typeof pt[0] !== "number" || typeof pt[1] !== "number") return false;
  }
  return true;
}

export async function GET() {
  try {
    const rows = await db.pen.findMany({ orderBy: [{ herd: "asc" }, { name: "asc" }] });
    return NextResponse.json({ pens: rows.map(toApi) });
  } catch (error) {
    console.error("GET /api/pens failed:", error);
    return NextResponse.json({ error: "Failed to load pens" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, herd, polygon, notes } = body ?? {};
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Missing 'name'" }, { status: 400 });
    }
    if (!herd || typeof herd !== "string") {
      return NextResponse.json({ error: "Missing 'herd'" }, { status: 400 });
    }
    if (!isValidPolygon(polygon)) {
      return NextResponse.json(
        { error: "Invalid 'polygon' — expected GeoJSON Polygon with at least 4 points" },
        { status: 400 }
      );
    }
    const row = await db.pen.create({
      data: {
        name: name.trim(),
        herd: herd.trim(),
        polygon: polygon as object,
        notes: typeof notes === "string" ? notes : "",
      },
    });
    return NextResponse.json({ pen: toApi(row) }, { status: 201 });
  } catch (error) {
    console.error("POST /api/pens failed:", error);
    return NextResponse.json({ error: "Failed to create pen" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, herd, polygon, notes } = body ?? {};
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Missing 'id'" }, { status: 400 });
    }
    const update: Record<string, unknown> = {};
    if (typeof name === "string") update.name = name.trim();
    if (typeof herd === "string") update.herd = herd.trim();
    if (typeof notes === "string") update.notes = notes;
    if (polygon !== undefined) {
      if (!isValidPolygon(polygon)) {
        return NextResponse.json(
          { error: "Invalid 'polygon' — expected GeoJSON Polygon with at least 4 points" },
          { status: 400 }
        );
      }
      update.polygon = polygon;
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }
    const row = await db.pen.update({
      where: { id },
      data: update as Parameters<typeof db.pen.update>[0]["data"],
    });
    return NextResponse.json({ pen: toApi(row) });
  } catch (error) {
    console.error("PATCH /api/pens failed:", error);
    return NextResponse.json({ error: "Failed to update pen" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing 'id' query param" }, { status: 400 });
    }
    await db.pen.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/pens failed:", error);
    return NextResponse.json({ error: "Failed to delete pen" }, { status: 500 });
  }
}
