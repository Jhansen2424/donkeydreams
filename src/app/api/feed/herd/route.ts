import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Herd-level base feed plans. A donkey's effective plan is the herd plan
// merged with their own /api/feed row (per-item, donkey override wins) —
// the merge happens client-side on the feed page.

interface ApiHerdPlan {
  id: string;
  herd: string;
  notes: string;
  plan: {
    am: { item: string; amount: string }[];
    mid: { item: string; amount: string }[];
    pm: { item: string; amount: string }[];
  };
}

function toApi(row: {
  id: string;
  herd: string;
  amPlan: unknown;
  midPlan: unknown;
  pmPlan: unknown;
  notes: string | null;
}): ApiHerdPlan {
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
    herd: row.herd,
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
    const rows = await db.herdFeedPlan.findMany({ orderBy: { herd: "asc" } });
    return NextResponse.json({ entries: rows.map(toApi) });
  } catch (error) {
    console.error("GET /api/feed/herd failed:", error);
    return NextResponse.json({ error: "Failed to load herd feed plans" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { herd, plan, notes } = body ?? {};
    if (!herd || typeof herd !== "string") {
      return NextResponse.json({ error: "Missing 'herd'" }, { status: 400 });
    }

    const am = Array.isArray(plan?.am) ? plan.am : [];
    const mid = Array.isArray(plan?.mid) ? plan.mid : [];
    const pm = Array.isArray(plan?.pm) ? plan.pm : [];

    // `herd` is unique — upsert lets callers create or update in one POST.
    const row = await db.herdFeedPlan.upsert({
      where: { herd },
      update: {
        amPlan: am,
        midPlan: mid,
        pmPlan: pm,
        notes: typeof notes === "string" ? notes : null,
      },
      create: {
        herd,
        amPlan: am,
        midPlan: mid,
        pmPlan: pm,
        notes: typeof notes === "string" ? notes : null,
      },
    });
    return NextResponse.json({ entry: toApi(row) }, { status: 201 });
  } catch (error) {
    console.error("POST /api/feed/herd failed:", error);
    return NextResponse.json({ error: "Failed to save herd feed plan" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing 'id' query param" }, { status: 400 });
    }
    await db.herdFeedPlan.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/feed/herd failed:", error);
    return NextResponse.json({ error: "Failed to delete herd feed plan" }, { status: 500 });
  }
}
