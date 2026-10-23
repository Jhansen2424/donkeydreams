// Change history: every create, edit and delete made through the app is
// written to the AuditLog table, automatically, by the database client
// (src/lib/db.ts wraps every write with `audited`). Client 10/23: if a donkey
// profile ever goes missing again, we can see who changed what, when, from
// which screen, and put it back from /app/history.
//
// What is kept:
//   edit    each changed field's value before and after
//   delete  the whole record as it was
//   create  the new record
// Photos are large (data URLs), so a photo is written out in full only in the
// entry that takes it out of the database (a delete, or an edit that removes
// it). Everywhere else it is a short "@photo:<md5>" stand-in, which a restore
// swaps back for the real photo.

import { AsyncLocalStorage } from "async_hooks";
import { createHash } from "crypto";
import { after } from "next/server";
import { cookies, headers } from "next/headers";
import { jwtVerify } from "jose";
import { Prisma, type PrismaClient } from "@prisma/client";

const SESSION_DATA_COOKIE = "__Secure-neon-auth.local.session_data";
const SESSION_TOKEN_COOKIE = "__Secure-neon-auth.session_token";

const WRITES = new Set([
  "create",
  "createMany",
  "createManyAndReturn",
  "update",
  "updateMany",
  "updateManyAndReturn",
  "upsert",
  "delete",
  "deleteMany",
]);

/** Strings this long are photos or files; logged as stand-ins unless removed. */
const BIG = 20_000;
/** Files over this are not copied into a delete entry (keeps the log small). */
const MAX_KEPT = 3_000_000;
/** Bulk writes: log at most this many records. */
const MAX_ROWS = 500;

type Row = Record<string, unknown>;
type Delegate = {
  findUnique(a: unknown): Promise<Row | null>;
  findMany(a: unknown): Promise<Row[]>;
};

export const md5 = (s: string) => createHash("md5").update(s, "utf8").digest("hex");
export const PHOTO_REF = /^@photo:([0-9a-f]{32})$/;
const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** Scalar column names per model (relations left out), from the schema. */
export const modelFields: Map<string, Prisma.DMMF.Field[]> = new Map(
  Prisma.dmmf.datamodel.models.map((m) => [m.name, m.fields.filter((f) => f.kind !== "object")])
);

// Plain JSON copy (Dates become ISO strings) so it can be stored in a Json column.
const plain = <T>(v: T): T => JSON.parse(JSON.stringify(v ?? null));

function swapBig(v: unknown, keep: (s: string) => boolean): unknown {
  if (typeof v === "string") return v.length > BIG && !keep(v) ? `@photo:${md5(v)}` : v;
  if (Array.isArray(v)) return v.map((x) => swapBig(x, keep));
  return v;
}

function bigStrings(v: unknown, out = new Set<string>()): Set<string> {
  if (typeof v === "string" && v.length > BIG) out.add(v);
  else if (Array.isArray(v)) v.forEach((x) => bigStrings(x, out));
  return out;
}

/** A short human name for a record: "Gabriel", "Gabriel: Hoof trim", a task title. */
export function labelOf(row: Row | null | undefined): string {
  if (!row) return "";
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = row[k];
      if (typeof v === "string" && v.trim() && v.length < 400) return v.trim();
    }
    return "";
  };
  const who = pick("animal", "animalName");
  const what = pick("name", "title", "herd", "text", "issue", "email", "type");
  const label = who && what && who !== what ? `${who}: ${what}` : who || what;
  return label.length > 90 ? label.slice(0, 87) + "..." : label;
}

function diff(before: Row, afterRow: Row) {
  const changes: Record<string, [unknown, unknown]> = {};
  for (const k of new Set([...Object.keys(before), ...Object.keys(afterRow)])) {
    if (k === "updatedAt") continue;
    const a = plain(before[k]);
    const b = plain(afterRow[k]);
    if (JSON.stringify(a) === JSON.stringify(b)) continue;
    // Keep a photo in full only if this edit removes it.
    const stays = bigStrings(b);
    changes[k] = [swapBig(a, (s) => !stays.has(s)), swapBig(b, () => false)];
  }
  return Object.keys(changes).length ? changes : null;
}

function fullSnapshot(row: Row) {
  const copy = { ...row };
  if (typeof copy.data === "string" && copy.data.length > MAX_KEPT) copy.data = "@omitted";
  return plain(copy);
}

const lightSnapshot = (row: Row) =>
  plain(Object.fromEntries(Object.entries(row).map(([k, v]) => [k, swapBig(v, () => false)])));

// ── Who and where ──

interface RequestInfo {
  dataCookie: string | null;
  tokenCookie: string | null;
  page: string | null;
}

async function requestInfo(): Promise<RequestInfo | null> {
  try {
    const store = await cookies();
    const h = await headers();
    let page: string | null = null;
    const ref = h.get("referer");
    if (ref) {
      try {
        const u = new URL(ref);
        page = (u.pathname + u.search).slice(0, 300);
      } catch {}
    }
    return {
      dataCookie: store.get(SESSION_DATA_COOKIE)?.value ?? null,
      tokenCookie: store.get(SESSION_TOKEN_COOKIE)?.value ?? null,
      page,
    };
  } catch {
    return null; // not inside a request (a script)
  }
}

async function whoDidIt(base: PrismaClient, info: RequestInfo | null) {
  if (!info) return { email: null, name: "Script / system" };
  const secret = process.env.NEON_AUTH_COOKIE_SECRET;
  if (info.dataCookie && secret) {
    try {
      // Only naming the person here (the request was already let in), so an
      // expired but genuinely signed cookie is fine.
      const { payload } = await jwtVerify(info.dataCookie, new TextEncoder().encode(secret), {
        clockTolerance: 60 * 60 * 24 * 90,
      });
      const u = (payload as { user?: { email?: string; name?: string } }).user;
      if (u?.email) return { email: u.email.toLowerCase(), name: u.name ?? null };
    } catch {}
  }
  if (info.tokenCookie) {
    try {
      const token = decodeURIComponent(info.tokenCookie).split(".")[0];
      const rows = await base.$queryRaw<{ email: string; name: string | null }[]>`
        SELECT u.email::text AS email, u.name::text AS name
        FROM neon_auth.session s JOIN neon_auth.user u ON u.id = s."userId"
        WHERE s.token = ${token} LIMIT 1`;
      if (rows[0]) return { email: rows[0].email.toLowerCase(), name: rows[0].name };
    } catch {}
  }
  return { email: null, name: null };
}

// ── The wrapper ──

const quiet = new AsyncLocalStorage<true>();

/** Run writes that aren't anyone's change (e.g. the automatic daily copies
 *  of routine tasks) without adding them to the history. */
export function unlogged<T>(fn: () => Promise<T>): Promise<T> {
  // Await inside the context: Prisma queries only start when awaited, so
  // returning the query un-awaited would run it outside "quiet".
  return quiet.run(true, async () => await fn());
}

export function shouldAudit(model: string | undefined, operation: string) {
  return !!model && model !== "AuditLog" && WRITES.has(operation) && !quiet.getStore();
}

export async function audited(
  base: PrismaClient,
  model: string,
  operation: string,
  args: Record<string, unknown>,
  run: (a: unknown) => Promise<unknown>
): Promise<unknown> {
  const d = (base as unknown as Record<string, Delegate>)[lowerFirst(model)];
  const info = await requestInfo();

  let before: Row[] = [];
  try {
    if (operation === "update" || operation === "upsert" || operation === "delete") {
      const r = await d.findUnique({ where: args.where });
      if (r) before = [r];
    } else if (operation === "updateMany" || operation === "updateManyAndReturn" || operation === "deleteMany") {
      before = await d.findMany({ where: args.where, take: MAX_ROWS });
    }
  } catch {
    // Logging must never block the actual save.
  }

  const result = await run(args);

  const write = async () => {
    try {
      const who = await whoDidIt(base, info);
      const entries: Prisma.AuditLogUncheckedCreateInput[] = [];
      const add = (action: string, row: Row | null, extra: Partial<Prisma.AuditLogUncheckedCreateInput>) =>
        entries.push({
          userEmail: who.email,
          userName: who.name,
          action,
          model,
          recordId: typeof row?.id === "string" ? row.id : null,
          label: labelOf(row),
          page: info?.page ?? null,
          ...extra,
        });

      const refetch = (id: unknown) =>
        typeof id === "string" ? d.findUnique({ where: { id } }) : Promise.resolve(null);

      if (operation === "create") {
        const row = (await refetch((result as Row)?.id)) ?? (result as Row);
        add("create", row, { snapshot: lightSnapshot(row) as Prisma.InputJsonValue });
      } else if (operation === "createMany" || operation === "createManyAndReturn") {
        const data = Array.isArray(args.data) ? (args.data as Row[]) : [args.data as Row];
        for (const row of data.slice(0, MAX_ROWS)) add("create", row, { snapshot: lightSnapshot(row) as Prisma.InputJsonValue });
      } else if (operation === "update" || operation === "upsert") {
        if (before[0]) {
          const now = await refetch(before[0].id);
          const changes = now && diff(before[0], now);
          if (changes) add("update", now, { changes: changes as Prisma.InputJsonValue });
        } else {
          const row = (await refetch((result as Row)?.id)) ?? (result as Row);
          add("create", row, { snapshot: lightSnapshot(row) as Prisma.InputJsonValue });
        }
      } else if (operation === "updateMany" || operation === "updateManyAndReturn") {
        const ids = before.map((r) => r.id);
        const now = ids.length ? await d.findMany({ where: { id: { in: ids } } }) : [];
        const byId = new Map(now.map((r) => [r.id, r]));
        for (const b of before) {
          const n = byId.get(b.id);
          const changes = n && diff(b, n);
          if (changes) add("update", n, { changes: changes as Prisma.InputJsonValue });
        }
      } else if (operation === "delete" || operation === "deleteMany") {
        for (const b of before) add("delete", b, { snapshot: fullSnapshot(b) as Prisma.InputJsonValue });
      }

      // One row per insert: createMany needs a transaction, which the Neon
      // HTTP driver doesn't support.
      for (const data of entries) await base.auditLog.create({ data });
    } catch (e) {
      console.error("change history: could not log", model, operation, e);
    }
  };

  // After the response is sent, so saving never waits on the log.
  try {
    after(write);
  } catch {
    void write(); // outside a request
  }
  return result;
}

// ── Putting things back ──

/** Swap "@photo:<md5>" stand-ins for the real photo, looked up in `pool`. */
export function resolvePhotos(v: unknown, pool: Map<string, string>): unknown {
  if (typeof v === "string") {
    const m = v.match(PHOTO_REF);
    return m ? pool.get(m[1]) ?? undefined : v;
  }
  if (Array.isArray(v)) return v.map((x) => resolvePhotos(x, pool)).filter((x) => x !== undefined);
  return v;
}

export function photoPool(...values: unknown[]): Map<string, string> {
  const pool = new Map<string, string>();
  for (const v of values) for (const s of bigStrings(v)) pool.set(md5(s), s);
  return pool;
}

/** Shape stored values back into what Prisma accepts for each column. */
export function toWriteData(model: string, values: Row): Row {
  const fields = modelFields.get(model) ?? [];
  const out: Row = {};
  for (const f of fields) {
    if (!(f.name in values) || f.name === "updatedAt") continue;
    const v = values[f.name];
    if (v === undefined) continue;
    if (f.type === "Json" && v === null) out[f.name] = Prisma.JsonNull;
    else out[f.name] = v;
  }
  return out;
}
