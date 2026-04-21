import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// API shape mirrors the UI's FeedSchedule shape so the page can consume it
// without a translation layer. `plan` is keyed by AM/Mid/PM time blocks.
interface ApiEntry {
  id: string;
  animal: string;
  notes: string;
  plan: {
    am: { item: string; amount: string }[];
    mid: { item: string; amount: string }[];
    pm: { item: string; amount: string }[];
  };
}

function toApi(row: {
  id: string;
  animalName: string;
  amPlan: unknown;
  midPlan: unknown;
  pmPlan: unknown;
  notes: string | null;
}): ApiEntry {
  const coerce = (v: unknown): { item: string; amount: string }[] => {
    if (!Array.isArray(v)) return [];
    return v
      .filter((x) => x && typeof x === "object")
      .map((x) => ({
        item: String((x as { item?: unknown }).item ?? ""),
        amount: String((x as { amount?: unknown }).amount ?? ""),
      }))
      .filter((x) => x.item.length > 0);
  };
  return {
    id: row.id,
    animal: row.animalName,
    notes: row.notes ?? "",
    plan: {
      am: coerce(row.amPlan),
      mid: coerce(row.midPlan),
      pm: coerce(row.pmPlan),
    },
  };
}

export async function GET() {
  try {
    const rows = await db.feedSchedule.findMany({ orderBy: { animalName: "asc" } });
    return NextResponse.json({ entries: rows.map(toApi) });
  } catch (error) {
    console.error("GET /api/feed failed:", error);
    return NextResponse.json({ error: "Failed to load feed schedules" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { animal, plan, notes } = body ?? {};
    if (!animal || typeof animal !== "string") {
      return NextResponse.json({ error: "Missing 'animal'" }, { status: 400 });
    }
    const animalRow = await db.animal.findUnique({ where: { name: animal } });
    if (!animalRow) {
      return NextResponse.json({ error: `Unknown animal '${animal}'` }, { status: 400 });
    }

    const am = Array.isArray(plan?.am) ? plan.am : [];
    const mid = Array.isArray(plan?.mid) ? plan.mid : [];
    const pm = Array.isArray(plan?.pm) ? plan.pm : [];

    // `animalId` is unique on FeedSchedule — upsert lets callers either
    // create or update in a single POST, keeping the client simple.
    const row = await db.feedSchedule.upsert({
      where: { animalId: animalRow.id },
      update: {
        amPlan: am,
        midPlan: mid,
        pmPlan: pm,
        notes: typeof notes === "string" ? notes : null,
      },
      create: {
        animalId: animalRow.id,
        animalName: animalRow.name,
        amPlan: am,
        midPlan: mid,
        pmPlan: pm,
        notes: typeof notes === "string" ? notes : null,
      },
    });
    return NextResponse.json({ entry: toApi(row) }, { status: 201 });
  } catch (error) {
    console.error("POST /api/feed failed:", error);
    return NextResponse.json({ error: "Failed to save feed plan" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, plan, notes } = body ?? {};
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Missing 'id'" }, { status: 400 });
    }
    const update: Record<string, unknown> = {};
    if (plan && typeof plan === "object") {
      if (Array.isArray(plan.am)) update.amPlan = plan.am;
      if (Array.isArray(plan.mid)) update.midPlan = plan.mid;
      if (Array.isArray(plan.pm)) update.pmPlan = plan.pm;
    }
    if (typeof notes === "string") update.notes = notes;

    const row = await db.feedSchedule.update({
      where: { id },
      data: update as Parameters<typeof db.feedSchedule.update>[0]["data"],
    });
    return NextResponse.json({ entry: toApi(row) });
  } catch (error) {
    console.error("PATCH /api/feed failed:", error);
    return NextResponse.json({ error: "Failed to update feed plan" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing 'id' query param" }, { status: 400 });
    }
    await db.feedSchedule.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/feed failed:", error);
    return NextResponse.json({ error: "Failed to delete feed plan" }, { status: 500 });
  }
}
