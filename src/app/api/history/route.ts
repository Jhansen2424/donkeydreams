import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { PHOTO_REF, modelFields, photoPool, resolvePhotos, toWriteData } from "@/lib/audit";

// Change history (written automatically by src/lib/audit.ts).
//   GET  ?model=Animal,MedicalEntry&q=gabriel&action=delete&before=<iso>  list, newest first
//   GET  ?id=<entry>                                                       one entry in full
//   POST { id }                                                            put a record back as it was

type Row = Record<string, unknown>;
type Delegate = {
  findUnique(a: unknown): Promise<Row | null>;
  update(a: unknown): Promise<Row>;
  create(a: unknown): Promise<Row>;
};
const delegate = (model: string) =>
  (db as unknown as Record<string, Delegate>)[model.charAt(0).toLowerCase() + model.slice(1)];

const PAGE = 60;

// A short readable value for the list view.
function brief(v: unknown): string {
  if (v === null || v === undefined || v === "") return "(empty)";
  if (typeof v === "string") {
    if (PHOTO_REF.test(v) || v.startsWith("data:image")) return "photo";
    if (v.startsWith("data:")) return "file";
    return v.length > 140 ? v.slice(0, 137) + "..." : v;
  }
  if (typeof v === "boolean") return v ? "yes" : "no";
  if (Array.isArray(v)) {
    const photos = v.filter((x) => typeof x === "string" && (PHOTO_REF.test(x) || x.startsWith("data:"))).length;
    if (photos && photos === v.length) return `${photos} photo${photos === 1 ? "" : "s"}`;
    const s = v.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join(", ");
    return s ? (s.length > 140 ? s.slice(0, 137) + "..." : s) : "(none)";
  }
  const s = JSON.stringify(v);
  return s.length > 140 ? s.slice(0, 137) + "..." : s;
}

const canRestore = (e: { action: string; model: string }) =>
  (e.action === "update" || e.action === "delete") && modelFields.has(e.model);

export async function GET(req: NextRequest) {
  try {
    const p = req.nextUrl.searchParams;
    const id = p.get("id");
    if (id) {
      const entry = await db.auditLog.findUnique({ where: { id } });
      if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ entry: { ...entry, canRestore: canRestore(entry) } });
    }

    const where: Prisma.AuditLogWhereInput = {};
    const models = p.get("model")?.split(",").filter(Boolean);
    if (models?.length) where.model = { in: models };
    const action = p.get("action");
    if (action) where.action = action;
    const recordId = p.get("recordId");
    if (recordId) where.recordId = recordId;
    const q = p.get("q")?.trim();
    if (q) {
      where.OR = [
        { label: { contains: q, mode: "insensitive" } },
        { userName: { contains: q, mode: "insensitive" } },
        { userEmail: { contains: q, mode: "insensitive" } },
      ];
    }
    const before = p.get("before");
    if (before) where.at = { lt: new Date(before) };

    const rows = await db.auditLog.findMany({
      where,
      orderBy: { at: "desc" },
      take: PAGE + 1,
      select: {
        id: true, at: true, userEmail: true, userName: true, action: true,
        model: true, recordId: true, label: true, page: true, changes: true,
      },
    });
    const more = rows.length > PAGE;
    const entries = rows.slice(0, PAGE).map((r) => {
      const changes = (r.changes ?? null) as Record<string, [unknown, unknown]> | null;
      return {
        id: r.id,
        at: r.at,
        who: r.userName || r.userEmail || "Unknown",
        userEmail: r.userEmail,
        action: r.action,
        model: r.model,
        recordId: r.recordId,
        label: r.label,
        page: r.page,
        fields: changes
          ? Object.entries(changes).map(([field, [b, a]]) => ({ field, before: brief(b), after: brief(a) }))
          : [],
        canRestore: canRestore(r),
      };
    });
    return NextResponse.json({ entries, more });
  } catch (e) {
    console.error("GET /api/history failed:", e);
    return NextResponse.json({ error: "Failed to load change history" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { id } = (await req.json()) as { id?: string };
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    const entry = await db.auditLog.findUnique({ where: { id } });
    if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canRestore(entry) || !entry.recordId) {
      return NextResponse.json({ error: "This change can't be put back" }, { status: 400 });
    }
    const d = delegate(entry.model);
    const current = await d.findUnique({ where: { id: entry.recordId } });

    // Photos may be saved in any entry for this record (whichever removed them).
    const related = await db.auditLog.findMany({
      where: { model: entry.model, recordId: entry.recordId },
      select: { changes: true, snapshot: true },
    });
    const pool = photoPool(
      ...Object.values(current ?? {}),
      ...related.flatMap((r) => [
        ...Object.values((r.changes ?? {}) as Record<string, unknown[]>).flat(),
        ...Object.values((r.snapshot ?? {}) as Row),
      ])
    );
    const resolve = (values: Row) =>
      Object.fromEntries(Object.entries(values).map(([k, v]) => [k, resolvePhotos(v, pool)]));

    if (entry.action === "update") {
      if (!current) {
        return NextResponse.json(
          { error: "This record was deleted later. Restore its delete entry instead." },
          { status: 409 }
        );
      }
      const changes = (entry.changes ?? {}) as Record<string, [unknown, unknown]>;
      const values = Object.fromEntries(Object.entries(changes).map(([k, [b]]) => [k, b]));
      delete values.id;
      delete values.createdAt;
      const data = toWriteData(entry.model, resolve(values));
      if (!Object.keys(data).length) return NextResponse.json({ ok: true, unchanged: true });
      await d.update({ where: { id: entry.recordId }, data });
      return NextResponse.json({ ok: true });
    }

    // delete: recreate the record as it was
    if (current) return NextResponse.json({ error: "It's already back." }, { status: 409 });
    const snapshot = (entry.snapshot ?? {}) as Row;
    if (Object.values(snapshot).includes("@omitted")) {
      return NextResponse.json({ error: "This file was too large to keep a copy of." }, { status: 422 });
    }
    try {
      await d.create({ data: toWriteData(entry.model, resolve(snapshot)) });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        return NextResponse.json(
          { error: "Something with the same name already exists, so this can't be put back as is." },
          { status: 409 }
        );
      }
      throw e;
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/history failed:", e);
    return NextResponse.json({ error: "Couldn't put it back" }, { status: 500 });
  }
}
