import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Volunteer CRUD. Identity = unique email. POST creates or upserts (if the
// email already exists we treat it as an update). PATCH requires `id` or
// `email` to identify the target. DELETE by id.

interface ApiVolunteer {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  startDate: string;
  availability: string[];
  skills: string[];
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelation: string;
  notes: string;
  hoursThisMonth: number;
  committedHoursPerDay: number;
}

function toApi(row: {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  startDate: string;
  availability: string[];
  skills: string[];
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelation: string;
  notes: string;
  hoursThisMonth: number;
  committedHoursPerDay: number;
}): ApiVolunteer {
  return row;
}

// Whitelist of fields a caller may set on create or update. `id`, timestamps,
// and any future server-managed fields are intentionally excluded.
const WRITABLE_FIELDS = [
  "name",
  "email",
  "phone",
  "role",
  "status",
  "startDate",
  "availability",
  "skills",
  "emergencyName",
  "emergencyPhone",
  "emergencyRelation",
  "notes",
  "hoursThisMonth",
  "committedHoursPerDay",
] as const;

function pickWritable(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of WRITABLE_FIELDS) {
    if (body[f] !== undefined) out[f] = body[f];
  }
  return out;
}

export async function GET() {
  try {
    const rows = await db.volunteer.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json({ volunteers: rows.map(toApi) });
  } catch (error) {
    console.error("GET /api/volunteers failed:", error);
    return NextResponse.json({ error: "Failed to load volunteers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body?.name || typeof body.name !== "string") {
      return NextResponse.json({ error: "Missing 'name'" }, { status: 400 });
    }
    if (!body?.email || typeof body.email !== "string") {
      return NextResponse.json({ error: "Missing 'email'" }, { status: 400 });
    }
    const data = pickWritable(body);
    // Sensible defaults for required columns if not provided.
    if (!data.startDate) data.startDate = new Date().toISOString().split("T")[0];

    // Upsert on unique email so re-submissions by name work idempotently.
    const row = await db.volunteer.upsert({
      where: { email: body.email },
      update: data as Parameters<typeof db.volunteer.update>[0]["data"],
      create: data as Parameters<typeof db.volunteer.create>[0]["data"],
    });
    return NextResponse.json({ volunteer: toApi(row) }, { status: 201 });
  } catch (error) {
    console.error("POST /api/volunteers failed:", error);
    return NextResponse.json({ error: "Failed to save volunteer" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, email, ...rest } = body ?? {};
    if (!id && !email) {
      return NextResponse.json(
        { error: "Provide 'id' or 'email' to identify the volunteer" },
        { status: 400 }
      );
    }
    const update = pickWritable(rest);
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No writable fields in payload" }, { status: 400 });
    }
    const where = id ? { id } : { email };
    const row = await db.volunteer.update({
      where,
      data: update as Parameters<typeof db.volunteer.update>[0]["data"],
    });
    return NextResponse.json({ volunteer: toApi(row) });
  } catch (error) {
    console.error("PATCH /api/volunteers failed:", error);
    return NextResponse.json({ error: "Failed to update volunteer" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const email = searchParams.get("email");
    if (!id && !email) {
      return NextResponse.json(
        { error: "Missing 'id' or 'email' query param" },
        { status: 400 }
      );
    }
    const where = id ? { id } : { email: email! };
    await db.volunteer.delete({ where });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/volunteers failed:", error);
    return NextResponse.json({ error: "Failed to delete volunteer" }, { status: 500 });
  }
}
