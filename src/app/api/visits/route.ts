import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Sign-in / sign-out system (GFAS requirement).
//
// GET ?view=state → { visitors, onSite } — everything the kiosk needs.
// GET ?view=report&from&to → sessions with moods for the admin report.
// POST { action: "create_visitor" | "sign_docs" | "sign_in" | "sign_out", ... }
//
// Signatures arrive as small PNG data URLs from the signature pad (capped
// server-side). Mood values are 1-5 (expectations 1-4), per Edj's spec.

const MAX_SIGNATURE_CHARS = 200_000; // ~150 KB PNG data URL

const MOOD_KEYS = new Set(["feeling", "energy", "anxiety", "connection", "expectations"]);

function cleanMoods(v: unknown): { questionKey: string; value: number }[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter(
      (m): m is { questionKey: string; value: number } =>
        !!m &&
        typeof m.questionKey === "string" &&
        MOOD_KEYS.has(m.questionKey) &&
        typeof m.value === "number" &&
        Number.isInteger(m.value) &&
        m.value >= 1 &&
        m.value <= 5
    )
    .slice(0, 5);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const view = searchParams.get("view") || "state";

    if (view === "report") {
      const from = searchParams.get("from");
      const to = searchParams.get("to");
      const where: Record<string, unknown> = {};
      if (from || to) {
        const range: Record<string, Date> = {};
        if (from) range.gte = new Date(from + "T00:00:00");
        if (to) range.lte = new Date(to + "T23:59:59");
        where.signInAt = range;
      }
      const sessions = await db.visitSession.findMany({
        where,
        orderBy: { signInAt: "desc" },
        take: 1000,
        include: {
          visitor: { select: { name: true, visitorType: true } },
          moods: { select: { phase: true, questionKey: true, value: true } },
        },
      });
      return NextResponse.json({
        sessions: sessions.map((s) => ({
          id: s.id,
          visitor: s.visitor.name,
          visitorType: s.visitor.visitorType,
          signInAt: s.signInAt.toISOString(),
          signOutAt: s.signOutAt?.toISOString() ?? null,
          standoutNote: s.standoutNote,
          moods: s.moods,
        })),
      });
    }

    // Default: kiosk state.
    const [visitors, openSessions] = await Promise.all([
      db.visitor.findMany({
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          visitorType: true,
          ndaSignedAt: true,
          waiverSignedAt: true,
        },
      }),
      db.visitSession.findMany({
        where: { signOutAt: null },
        orderBy: { signInAt: "asc" },
        select: { id: true, visitorId: true, signInAt: true },
      }),
    ]);
    return NextResponse.json({
      visitors: visitors.map((v) => ({
        id: v.id,
        name: v.name,
        visitorType: v.visitorType,
        ndaSigned: Boolean(v.ndaSignedAt),
        waiverSigned: Boolean(v.waiverSignedAt),
      })),
      onSite: openSessions.map((s) => ({
        sessionId: s.id,
        visitorId: s.visitorId,
        signInAt: s.signInAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("GET /api/visits failed:", error);
    return NextResponse.json({ error: "Failed to load sign-in data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body?.action;

    if (action === "create_visitor") {
      const { name, phone, email, emergencyName, emergencyPhone, visitorType } = body ?? {};
      if (!name || typeof name !== "string" || !name.trim()) {
        return NextResponse.json({ error: "Missing 'name'" }, { status: 400 });
      }
      const row = await db.visitor.create({
        data: {
          name: name.trim(),
          phone: typeof phone === "string" ? phone.trim() : "",
          email: typeof email === "string" ? email.trim() : "",
          emergencyName: typeof emergencyName === "string" ? emergencyName.trim() : "",
          emergencyPhone: typeof emergencyPhone === "string" ? emergencyPhone.trim() : "",
          visitorType: visitorType === "volunteer" ? "volunteer" : "visitor",
        },
        select: { id: true, name: true, visitorType: true },
      });
      return NextResponse.json({ visitor: row }, { status: 201 });
    }

    if (action === "sign_docs") {
      const { visitorId, ndaSignature, waiverSignature, ndaVersion } = body ?? {};
      if (!visitorId || typeof visitorId !== "string") {
        return NextResponse.json({ error: "Missing 'visitorId'" }, { status: 400 });
      }
      const update: Record<string, unknown> = {};
      if (typeof ndaSignature === "string" && ndaSignature.startsWith("data:image/")) {
        if (ndaSignature.length > MAX_SIGNATURE_CHARS) {
          return NextResponse.json({ error: "Signature image too large" }, { status: 413 });
        }
        update.ndaSignature = ndaSignature;
        update.ndaSignedAt = new Date();
        update.ndaVersion =
          ndaVersion === "sponsors-volunteers" ? "sponsors-volunteers" : "third-parties";
      }
      if (typeof waiverSignature === "string" && waiverSignature.startsWith("data:image/")) {
        if (waiverSignature.length > MAX_SIGNATURE_CHARS) {
          return NextResponse.json({ error: "Signature image too large" }, { status: 413 });
        }
        update.waiverSignature = waiverSignature;
        update.waiverSignedAt = new Date();
      }
      if (Object.keys(update).length === 0) {
        return NextResponse.json({ error: "No signatures provided" }, { status: 400 });
      }
      await db.visitor.update({ where: { id: visitorId }, data: update });
      return NextResponse.json({ ok: true });
    }

    if (action === "sign_in") {
      const { visitorId } = body ?? {};
      if (!visitorId || typeof visitorId !== "string") {
        return NextResponse.json({ error: "Missing 'visitorId'" }, { status: 400 });
      }
      // One open session per visitor — signing in twice reuses the open one.
      const existing = await db.visitSession.findFirst({
        where: { visitorId, signOutAt: null },
      });
      const session =
        existing ??
        (await db.visitSession.create({ data: { visitorId } }));
      const moods = cleanMoods(body?.moods);
      for (const m of moods) {
        await db.moodResponse.create({
          data: { sessionId: session.id, phase: "in", ...m },
        });
      }
      return NextResponse.json({ sessionId: session.id }, { status: 201 });
    }

    if (action === "sign_out") {
      const { sessionId, standoutNote } = body ?? {};
      if (!sessionId || typeof sessionId !== "string") {
        return NextResponse.json({ error: "Missing 'sessionId'" }, { status: 400 });
      }
      await db.visitSession.update({
        where: { id: sessionId },
        data: {
          signOutAt: new Date(),
          standoutNote:
            typeof standoutNote === "string" ? standoutNote.trim().slice(0, 2000) : "",
        },
      });
      const moods = cleanMoods(body?.moods);
      for (const m of moods) {
        await db.moodResponse.create({
          data: { sessionId, phase: "out", ...m },
        });
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown 'action'" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/visits failed:", error);
    return NextResponse.json({ error: "Failed to save sign-in data" }, { status: 500 });
  }
}
