"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  History,
  Search,
  X,
  Pencil,
  Plus,
  Trash2,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/lib/toast-context";

// Every change made in the app (see src/lib/audit.ts), newest first, with a
// way to put an edited or deleted record back the way it was.

const NAMES: Record<string, string> = {
  Animal: "donkey profile",
  MedicalEntry: "medical record",
  WatchAlert: "watch alert",
  TaskTemplate: "routine task",
  TaskCompletion: "task",
  FeedSchedule: "feed plan",
  HerdFeedPlan: "herd feed plan",
  HoofVisit: "hoof visit",
  DentalVisit: "dental visit",
  WeighIn: "weigh-in",
  Volunteer: "volunteer",
  Photo: "photo",
  ParkingLotEntry: "note",
  KnowledgeArticle: "knowledge article",
  Provider: "provider",
  TrimProfileOverride: "trim profile",
  DocumentFolder: "folder",
  Document: "document",
  Visitor: "visitor",
  VisitSession: "visit",
  MoodResponse: "visit survey",
  Sighting: "roll call",
  Pen: "pen",
};

const GROUPS: { key: string; label: string; models: string[] }[] = [
  { key: "all", label: "Everything", models: [] },
  { key: "donkeys", label: "Donkey profiles", models: ["Animal"] },
  { key: "medical", label: "Medical & care", models: ["MedicalEntry", "HoofVisit", "DentalVisit", "WeighIn", "TrimProfileOverride"] },
  { key: "tasks", label: "Tasks", models: ["TaskTemplate", "TaskCompletion"] },
  { key: "notes", label: "Notes & watch", models: ["ParkingLotEntry", "WatchAlert", "KnowledgeArticle"] },
  { key: "feed", label: "Feed", models: ["FeedSchedule", "HerdFeedPlan"] },
  { key: "other", label: "Other", models: ["Volunteer", "Photo", "Provider", "DocumentFolder", "Document", "Visitor", "VisitSession", "MoodResponse", "Sighting", "Pen"] },
];

// Plain names for fields, where the column name isn't already readable.
const FIELD_NAMES: Record<string, string> = {
  profileImage: "Profile photo",
  galleryImages: "Photos",
  isSpecialNeeds: "Special needs",
  isBondedPair: "Bonded pair",
  needsChip: "Needs microchip",
  momBabyCount: "Mom & baby count",
  bestFriends: "Best friends",
  behavioralNotes: "Behavior notes",
  nextHoofDue: "Next hoof trim",
  nextDentalDue: "Next dental",
  sortOrder: "Order",
  dueDate: "Due date",
  completedAt: "Completed at",
  completedBy: "Completed by",
};
const fieldName = (f: string) =>
  FIELD_NAMES[f] ?? f.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());

interface ListEntry {
  id: string;
  at: string;
  who: string;
  userEmail: string | null;
  action: "create" | "update" | "delete";
  model: string;
  recordId: string | null;
  label: string;
  page: string | null;
  fields: { field: string; before: string; after: string }[];
  canRestore: boolean;
}

interface FullEntry {
  id: string;
  action: string;
  changes: Record<string, [unknown, unknown]> | null;
  snapshot: Record<string, unknown> | null;
}

const VERB = { create: "added", update: "edited", delete: "deleted" } as const;
const ICON = { create: Plus, update: Pencil, delete: Trash2 } as const;
const TONE = {
  create: "bg-emerald-50 text-emerald-700",
  update: "bg-amber-50 text-amber-700",
  delete: "bg-red-50 text-red-700",
} as const;

function dayLabel(d: Date) {
  const today = new Date();
  const y = new Date();
  y.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export default function HistoryPage() {
  const { toastSuccess, toastError } = useToast();
  const [group, setGroup] = useState("all");
  const [deletedOnly, setDeletedOnly] = useState(false);
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState<ListEntry[]>([]);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadId = useRef(0);

  // ?q=Gabriel (from a donkey's profile) starts the page searched.
  useEffect(() => {
    const start = new URLSearchParams(window.location.search).get("q");
    if (start) {
      setQ(start);
      setQuery(start);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setQuery(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(
    async (append: boolean, beforeAt?: string) => {
      const mine = ++loadId.current;
      setLoading(true);
      setError(null);
      const p = new URLSearchParams();
      const models = GROUPS.find((g) => g.key === group)?.models ?? [];
      if (models.length) p.set("model", models.join(","));
      if (deletedOnly) p.set("action", "delete");
      if (query) p.set("q", query);
      if (beforeAt) p.set("before", beforeAt);
      try {
        const res = await fetch(`/api/history?${p}`, { cache: "no-store" });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Failed to load");
        if (mine !== loadId.current) return;
        setEntries((prev) => (append ? [...prev, ...body.entries] : body.entries));
        setMore(body.more);
      } catch (e) {
        if (mine === loadId.current) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (mine === loadId.current) setLoading(false);
      }
    },
    [group, deletedOnly, query]
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  const restore = async (e: ListEntry) => {
    const what = `${e.label || NAMES[e.model] || e.model}`;
    const ask =
      e.action === "delete"
        ? `Bring back "${what}" exactly as it was before it was deleted?`
        : `Put ${what}'s ${e.fields.map((f) => fieldName(f.field).toLowerCase()).join(", ")} back to how it was before this change?`;
    if (!window.confirm(ask)) return;
    try {
      const res = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: e.id }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Couldn't put it back");
      toastSuccess(`${what} is back`);
      void load(false);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Couldn't put it back");
    }
  };

  // Group the list by day.
  const days: { label: string; items: ListEntry[] }[] = [];
  for (const e of entries) {
    const label = dayLabel(new Date(e.at));
    const last = days[days.length - 1];
    if (last?.label === label) last.items.push(e);
    else days.push({ label, items: [e] });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-charcoal flex items-center gap-2">
          <History className="w-6 h-6 text-sidebar" />
          Change History
        </h1>
        <p className="text-sm text-warm-gray mt-0.5">
          Every change made in the app: who, when and what. Anything edited or deleted can be put back.
        </p>
      </div>

      <div className="space-y-3">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-warm-gray absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search a donkey, task or person"
            className="w-full pl-9 pr-9 py-2.5 rounded-lg border border-card-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sidebar/30"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-warm-gray hover:text-charcoal"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {GROUPS.map((g) => (
            <button
              key={g.key}
              type="button"
              onClick={() => setGroup(g.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                group === g.key
                  ? "bg-sidebar text-white border-sidebar"
                  : "bg-white text-charcoal border-card-border hover:bg-cream"
              }`}
            >
              {g.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setDeletedOnly((v) => !v)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors inline-flex items-center gap-1 ${
              deletedOnly
                ? "bg-red-600 text-white border-red-600"
                : "bg-white text-charcoal border-card-border hover:bg-cream"
            }`}
          >
            <Trash2 className="w-3 h-3" />
            Deleted only
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {!loading && !error && entries.length === 0 && (
        <div className="rounded-xl border border-card-border bg-white px-5 py-10 text-center text-sm text-warm-gray">
          No changes found{query ? ` for "${query}"` : ""}.
        </div>
      )}

      {days.map((day) => (
        <section key={day.label} className="space-y-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-warm-gray/70">{day.label}</h2>
          <div className="rounded-xl border border-card-border bg-white divide-y divide-card-border overflow-hidden">
            {day.items.map((e) => (
              <EntryRow key={e.id} entry={e} onRestore={() => void restore(e)} />
            ))}
          </div>
        </section>
      ))}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-warm-gray">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading
        </div>
      )}
      {more && !loading && (
        <button
          type="button"
          onClick={() => void load(true, entries[entries.length - 1]?.at)}
          className="px-4 py-2.5 rounded-lg border border-card-border bg-white text-sm font-medium text-charcoal hover:bg-cream"
        >
          Show older changes
        </button>
      )}
    </div>
  );
}

function EntryRow({ entry: e, onRestore }: { entry: ListEntry; onRestore: () => void }) {
  const [open, setOpen] = useState(false);
  const [full, setFull] = useState<FullEntry | null>(null);
  const Icon = ICON[e.action] ?? Pencil;
  const thing = NAMES[e.model] ?? e.model;
  const time = new Date(e.at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && !full) {
      try {
        const res = await fetch(`/api/history?id=${encodeURIComponent(e.id)}`, { cache: "no-store" });
        const body = await res.json();
        if (res.ok) setFull(body.entry);
      } catch {}
    }
  };

  return (
    <div className="px-4 py-3">
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${TONE[e.action]}`}>
          <Icon className="w-3.5 h-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-charcoal">
            <span className="font-semibold">{e.who}</span> {VERB[e.action] ?? e.action} {e.label ? "" : "a "}
            {e.label ? (
              <>
                <span className="font-semibold">{e.label}</span>
                <span className="text-warm-gray"> ({thing})</span>
              </>
            ) : (
              thing
            )}
          </p>
          <p className="text-xs text-warm-gray mt-0.5">
            {time}
            {e.page && (
              <>
                {" · from "}
                <Link href={e.page} className="underline decoration-dotted hover:text-charcoal">
                  {e.page.split("?")[0].replace(/^\/app\/?/, "") || "dashboard"}
                </Link>
              </>
            )}
          </p>
          {e.fields.length > 0 && (
            <ul className="mt-2 space-y-1">
              {e.fields.slice(0, open ? undefined : 4).map((f) => (
                <li key={f.field} className="text-xs text-charcoal break-words">
                  <span className="font-medium">{fieldName(f.field)}:</span>{" "}
                  <span className="text-red-700/80 line-through decoration-red-300">{f.before}</span>
                  {" → "}
                  <span className="text-emerald-800">{f.after}</span>
                </li>
              ))}
              {!open && e.fields.length > 4 && (
                <li className="text-xs text-warm-gray">and {e.fields.length - 4} more</li>
              )}
            </ul>
          )}
          {open && full && <Details entry={full} />}
        </div>
        <div className="shrink-0 flex flex-col sm:flex-row items-end sm:items-center gap-1.5">
          {e.canRestore && (
            <button
              type="button"
              onClick={onRestore}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-sidebar text-white hover:bg-sidebar-light"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Put back
            </button>
          )}
          <button
            type="button"
            onClick={() => void toggle()}
            className="inline-flex items-center gap-0.5 px-2 py-1.5 rounded-lg text-xs text-warm-gray hover:text-charcoal hover:bg-cream"
          >
            {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            Details
          </button>
        </div>
      </div>
    </div>
  );
}

function Value({ v }: { v: unknown }) {
  if (typeof v === "string" && v.startsWith("data:image")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={v} alt="" className="w-16 h-16 rounded-md object-cover inline-block mr-1 mb-1" />;
  }
  if (typeof v === "string" && v.startsWith("@photo:")) return <span className="text-warm-gray">photo (saved)</span>;
  if (Array.isArray(v)) {
    if (!v.length) return <span className="text-warm-gray">(none)</span>;
    return (
      <span>
        {v.map((x, i) => (
          <span key={i}>
            <Value v={x} />
            {typeof x !== "string" || !x.startsWith("data:image") ? (i < v.length - 1 ? ", " : "") : null}
          </span>
        ))}
      </span>
    );
  }
  if (v === null || v === undefined || v === "") return <span className="text-warm-gray">(empty)</span>;
  if (typeof v === "boolean") return <span>{v ? "yes" : "no"}</span>;
  if (typeof v === "object") return <span className="font-mono text-[11px]">{JSON.stringify(v)}</span>;
  return <span className="whitespace-pre-wrap">{String(v)}</span>;
}

function Details({ entry }: { entry: FullEntry }) {
  const rows = entry.snapshot
    ? Object.entries(entry.snapshot).filter(([k]) => k !== "updatedAt")
    : null;
  return (
    <div className="mt-3 rounded-lg bg-cream/60 border border-card-border p-3 text-xs text-charcoal space-y-1.5 max-h-[28rem] overflow-auto">
      {rows ? (
        <>
          <p className="font-semibold text-warm-gray uppercase tracking-wider text-[10px]">
            {entry.action === "delete" ? "Everything it had when deleted" : "What was added"}
          </p>
          {rows.map(([k, v]) => (
            <div key={k} className="break-words">
              <span className="font-medium">{fieldName(k)}:</span> <Value v={v} />
            </div>
          ))}
        </>
      ) : entry.changes ? (
        Object.entries(entry.changes).map(([k, [b, a]]) => (
          <div key={k} className="break-words">
            <p className="font-medium">{fieldName(k)}</p>
            <p>
              <span className="text-warm-gray">Before: </span>
              <Value v={b} />
            </p>
            <p>
              <span className="text-warm-gray">After: </span>
              <Value v={a} />
            </p>
          </div>
        ))
      ) : (
        <p className="text-warm-gray">No details saved.</p>
      )}
    </div>
  );
}
