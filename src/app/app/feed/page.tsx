"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, AlertCircle, Plus, X, Check, Trash2, Pencil, Printer } from "lucide-react";
import type { FeedSchedule } from "@/lib/sanctuary-data";
import { useAnimals } from "@/lib/animals-context";
import { useParkingLot } from "@/lib/parking-lot-context";
import { formatDate } from "@/lib/format-date";
import ExpandableText from "@/components/app/ExpandableText";

const noteStyles: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  daily: { bg: "bg-sky/5", border: "border-sky/20", text: "text-charcoal", icon: "text-sky" },
  ongoing: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", icon: "text-amber-500" },
  evergreen: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", icon: "text-emerald-500" },
};

const categoryLabels: Record<string, string> = {
  daily: "Daily",
  ongoing: "Ongoing",
  evergreen: "Permanent",
};

type FeedNoteCategory = "daily" | "ongoing" | "evergreen";

interface ApiFeedEntry {
  id: string;
  animal: string;
  notes: string;
  plan: {
    am: { item: string; amount: string }[];
    mid: { item: string; amount: string }[];
    pm: { item: string; amount: string }[];
  };
}

// Herd-level base plan (from /api/feed/herd). A donkey's effective plan is
// this merged with their own row — per item, the donkey's entry wins.
interface ApiHerdPlan {
  id: string;
  herd: string;
  notes: string;
  plan: ApiFeedEntry["plan"];
}

export default function FeedPage() {
  const [search, setSearch] = useState("");
  const [herdFilter, setHerdFilter] = useState<string>("all");
  const [schedules, setSchedules] = useState<ApiFeedEntry[]>([]);
  const [herdPlans, setHerdPlans] = useState<ApiHerdPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ApiFeedEntry | null>(null);
  const [editingHerd, setEditingHerd] = useState<ApiHerdPlan | null>(null);
  const [addingNew, setAddingNew] = useState(false);

  const { entries: parkingEntries, addEntry, removeEntry } = useParkingLot();
  // Live roster (CSV base + DB overlay) so herd moves and new animals are
  // reflected in feed grouping without a rebuild.
  const { animals } = useAnimals();

  // Map donkey name → herd, so we can group / filter feed plans by herd
  // without having to refetch the Animal table.
  const herdByAnimal = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of animals) m.set(a.name, a.herd);
    return m;
  }, [animals]);

  // Unique herd list (sorted), used for the filter chips + the modal's
  // "Apply to herd" picker.
  const allHerds = useMemo(() => {
    const set = new Set<string>();
    for (const a of animals) if (a.herd) set.add(a.herd);
    return Array.from(set).sort();
  }, [animals]);

  // Load per-donkey + herd-level feed plans from the API.
  const reload = async () => {
    setLoading(true);
    try {
      const [res, herdRes] = await Promise.all([
        fetch("/api/feed", { cache: "no-store" }),
        fetch("/api/feed/herd", { cache: "no-store" }),
      ]);
      if (!res.ok) throw new Error("Failed to load feed plans");
      const body = (await res.json()) as { entries: ApiFeedEntry[] };
      setSchedules(body.entries);
      if (herdRes.ok) {
        const herdBody = (await herdRes.json()) as { entries: ApiHerdPlan[] };
        setHerdPlans(herdBody.entries);
      }
    } catch {
      // surfaced below; leave list empty
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  // Feed notes live as parking-lot entries of type "feed". The category is
  // stored on `data.category` (daily/ongoing/evergreen).
  const feedNotes = parkingEntries
    .filter((e) => e.type === "feed" && !e.resolved)
    .map((e) => ({
      id: e.id,
      text: e.text,
      category: (e.data?.category ?? "daily") as FeedNoteCategory,
    }));

  const filtered = schedules.filter((f) => {
    if (search && !f.animal.toLowerCase().includes(search.toLowerCase())) return false;
    if (herdFilter !== "all" && herdByAnimal.get(f.animal) !== herdFilter) return false;
    return true;
  });

  const herdPlanByHerd = useMemo(
    () => new Map(herdPlans.map((p) => [p.herd, p])),
    [herdPlans]
  );

  // Group the visible cards by herd when no search is active. The search
  // filter falls back to a flat list since the user is looking for a single
  // donkey by name. Herds that have a herd-level plan get a section even
  // when no donkey has an override yet.
  const grouped = useMemo(() => {
    if (search) return null;
    const m = new Map<string, ApiFeedEntry[]>();
    for (const p of herdPlans) {
      if (herdFilter !== "all" && p.herd !== herdFilter) continue;
      m.set(p.herd, []);
    }
    for (const s of filtered) {
      const h = herdByAnimal.get(s.animal) ?? "Unassigned";
      const arr = m.get(h) ?? [];
      arr.push(s);
      m.set(h, arr);
    }
    return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered, herdByAnimal, search, herdPlans, herdFilter]);

  const animalsWithoutPlan = useMemo(() => {
    const have = new Set(schedules.map((s) => s.animal));
    return animals
      .filter((a) => !have.has(a.name))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [schedules, animals]);

  return (
    <div className="space-y-6">
      {/* Print-only heading */}
      <div className="hidden print:block border-b-2 border-charcoal pb-2">
        <h1 className="text-2xl font-bold text-charcoal">
          Feed Plans — {formatDate(new Date())}
        </h1>
        <p className="text-sm text-charcoal mt-0.5">
          {schedules.length} donkeys with custom feed plans
        </p>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">
            Daily Feed Plans
          </h1>
          <p className="text-sm text-warm-gray mt-0.5">
            {schedules.length} donkeys with custom feed plans
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-card-border rounded-lg text-sm font-medium text-charcoal hover:bg-cream transition-colors"
            title="Print the feed plans (or save as PDF)"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray/50" />
            <input
              type="text"
              placeholder="Search donkey..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-card-border rounded-lg text-sm text-charcoal placeholder:text-warm-gray/50 focus:outline-none focus:ring-2 focus:ring-sand/50 w-full sm:w-56"
            />
          </div>
          <button
            onClick={() => setAddingNew(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-sidebar text-white rounded-lg text-sm font-medium hover:bg-sidebar-light transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add feed plan
          </button>
        </div>
      </div>

      {/* Feed notes */}
      <FeedNotesSection
        notes={feedNotes}
        onAdd={async (text, category) => {
          await addEntry("feed", text, { category });
        }}
        onRemove={(id) => removeEntry(id)}
      />

      {/* Herd filter chips */}
      <div className="flex flex-wrap gap-1.5 print:hidden">
        <button
          onClick={() => setHerdFilter("all")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
            herdFilter === "all"
              ? "bg-sidebar text-white border-sidebar"
              : "bg-white text-charcoal border-card-border hover:bg-cream"
          }`}
        >
          All herds
        </button>
        {allHerds.map((h) => {
          const count = schedules.filter((s) => herdByAnimal.get(s.animal) === h).length;
          return (
            <button
              key={h}
              onClick={() => setHerdFilter(h)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                herdFilter === h
                  ? "bg-sidebar text-white border-sidebar"
                  : "bg-white text-charcoal border-card-border hover:bg-cream"
              }`}
            >
              {h} <span className="opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Feed grid — grouped by herd when no search filter is active */}
      {loading ? (
        <p className="text-sm text-warm-gray/60 text-center py-10">Loading feed plans...</p>
      ) : grouped ? (
        <div className="space-y-6">
          {grouped.map(([herd, items]) => {
            const herdPlan = herdPlanByHerd.get(herd) ?? null;
            return (
              <div key={herd}>
                <div className="flex items-baseline justify-between mb-2">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-warm-gray/80">
                    {herd}
                  </h2>
                  <span className="text-xs text-warm-gray/60">
                    {herdPlan ? "herd plan" : ""}
                    {herdPlan && items.length > 0 ? " · " : ""}
                    {items.length > 0 ? `${items.length} donkey plan${items.length === 1 ? "" : "s"}` : ""}
                  </span>
                </div>
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 print:grid-cols-2 print:gap-3">
                  {herdPlan && (
                    <FeedCard
                      key={`herd-${herd}`}
                      schedule={{
                        id: herdPlan.id,
                        animal: "Whole herd",
                        notes: herdPlan.notes,
                        plan: herdPlan.plan,
                      }}
                      isHerd
                      onEdit={() => setEditingHerd(herdPlan)}
                      onDelete={async () => {
                        if (confirm(`Delete the herd feed plan for ${herd}?`)) {
                          await fetch(`/api/feed/herd?id=${herdPlan.id}`, { method: "DELETE" });
                          await reload();
                        }
                      }}
                    />
                  )}
                  {items.map((schedule) => (
                    <FeedCard
                      key={schedule.animal}
                      schedule={schedule}
                      herdPlan={herdPlan}
                      onEdit={() => setEditing(schedule)}
                      onDelete={async () => {
                        if (confirm(`Delete feed plan for ${schedule.animal}?`)) {
                          await fetch(`/api/feed?id=${schedule.id}`, { method: "DELETE" });
                          await reload();
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 print:grid-cols-2 print:gap-3">
          {filtered.map((schedule) => (
            <FeedCard
              key={schedule.animal}
              schedule={schedule}
              herdPlan={herdPlanByHerd.get(herdByAnimal.get(schedule.animal) ?? "") ?? null}
              onEdit={() => setEditing(schedule)}
              onDelete={async () => {
                if (confirm(`Delete feed plan for ${schedule.animal}?`)) {
                  await fetch(`/api/feed?id=${schedule.id}`, { method: "DELETE" });
                  await reload();
                }
              }}
            />
          ))}
        </div>
      )}

      {filtered.length === 0 && herdPlans.length === 0 && !loading && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🫏</p>
          <p className="text-warm-gray font-medium">No feed plans found</p>
          <button
            onClick={() => setAddingNew(true)}
            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-sidebar text-white rounded-lg text-sm font-medium hover:bg-sidebar-light transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add feed plan
          </button>
        </div>
      )}

      {(editing || editingHerd || addingNew) && (
        <FeedPlanModal
          initial={editing}
          initialHerd={editingHerd}
          animalChoices={
            editing
              ? [editing.animal]
              : animalsWithoutPlan.map((a) => a.name)
          }
          herdChoices={allHerds}
          onClose={() => {
            setEditing(null);
            setEditingHerd(null);
            setAddingNew(false);
          }}
          onSave={async (data) => {
            if (data.scope === "herd" && data.herd) {
              // One herd-level row; per-donkey rows stay untouched and act
              // as overrides/additions on top of it.
              await fetch("/api/feed/herd", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  herd: data.herd,
                  plan: data.plan,
                  notes: data.notes,
                }),
              });
            } else {
              for (const animal of data.targets) {
                await fetch("/api/feed", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    animal,
                    plan: data.plan,
                    notes: data.notes,
                  }),
                });
              }
            }
            await reload();
            setEditing(null);
            setEditingHerd(null);
            setAddingNew(false);
          }}
        />
      )}
    </div>
  );
}

function FeedCard({
  schedule,
  herdPlan,
  isHerd,
  onEdit,
  onDelete,
}: {
  schedule: ApiFeedEntry;
  /** Herd base plan merged under this donkey's own items (donkey wins). */
  herdPlan?: ApiHerdPlan | null;
  /** Renders as the herd's shared plan card. */
  isHerd?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const meals = [
    { label: "AM", items: schedule.plan.am, color: "bg-amber-500" },
    { label: "MID", items: schedule.plan.mid, color: "bg-sky" },
    { label: "PM", items: schedule.plan.pm, color: "bg-purple-500" },
  ];
  const rows = getItemRows(schedule, herdPlan ?? null);
  // Link the card title to the donkey's profile (herd cards have none).
  const { animals } = useAnimals();
  const profileSlug = isHerd
    ? null
    : animals.find((a) => a.name === schedule.animal)?.slug ?? null;

  return (
    <div className="group bg-white rounded-xl border border-card-border overflow-hidden break-inside-avoid">
      <div className={`${isHerd ? "bg-sky" : "bg-sidebar"} px-4 py-3 flex items-center justify-between print:bg-transparent print:border-b-2 print:border-charcoal`}>
        {profileSlug ? (
          <a
            href={`/app/animals/${profileSlug}`}
            className="font-bold text-white hover:underline print:text-charcoal"
            title={`Open ${schedule.animal}'s profile`}
          >
            {schedule.animal}
          </a>
        ) : (
          <h3 className="font-bold text-white print:text-charcoal">{schedule.animal}</h3>
        )}
        <div className="flex items-center gap-2 print:hidden">
          <div className="flex gap-1">
            {meals.map((m) => (
              <span
                key={m.label}
                className={`text-[10px] font-bold text-white px-1.5 py-0.5 rounded ${m.color}`}
              >
                {m.label}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              title="Edit plan"
              className="p-1 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              title="Delete plan"
              className="p-1 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] font-semibold uppercase tracking-wider text-warm-gray/60">
              <th className="text-left pb-2">Item</th>
              <th className="text-center pb-2 w-16">AM</th>
              <th className="text-center pb-2 w-16">MID</th>
              <th className="text-center pb-2 w-16">PM</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.item} className="border-t border-card-border">
                <td className="py-2 font-medium text-charcoal">
                  {row.item}
                  {row.source === "herd" && (
                    <span className="ml-1.5 text-[9px] font-semibold uppercase tracking-wider text-sky bg-sky/10 px-1.5 py-0.5 rounded">
                      herd
                    </span>
                  )}
                </td>
                <td className="py-2 text-center text-warm-gray">{row.am || "—"}</td>
                <td className="py-2 text-center text-warm-gray">{row.mid || "—"}</td>
                <td className="py-2 text-center text-warm-gray">{row.pm || "—"}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-xs text-warm-gray/60">
                  No items yet — click edit to add.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {schedule.notes && (
          <div className="mt-3 p-2.5 bg-cream/50 rounded-lg">
            <ExpandableText
              text={schedule.notes}
              className="text-xs text-warm-gray leading-relaxed"
              clampChars={280}
            />
          </div>
        )}
      </div>
    </div>
  );
}

type ItemRow = {
  item: string;
  am: string;
  mid: string;
  pm: string;
  source: "herd" | "donkey";
};

// Union AM/MID/PM into per-item rows. When a herd base plan is supplied its
// items come first tagged "herd"; the donkey's own entries then overlay by
// item name (case-insensitive) — a donkey row for the same item replaces the
// herd amounts entirely.
function getItemRows(
  schedule: Pick<FeedSchedule, "plan"> | ApiFeedEntry,
  herdPlan?: ApiHerdPlan | null
): ItemRow[] {
  const items = new Map<string, ItemRow>();
  const fill = (
    plan: ApiFeedEntry["plan"],
    source: "herd" | "donkey"
  ) => {
    for (const block of ["am", "mid", "pm"] as const) {
      for (const entry of plan[block]) {
        const key = entry.item.trim().toLowerCase();
        let row = items.get(key);
        if (!row || (row.source === "herd" && source === "donkey")) {
          row = { item: entry.item, am: "", mid: "", pm: "", source };
          items.set(key, row);
        }
        if (row.source === source) row[block] = entry.amount;
      }
    }
  };
  if (herdPlan) fill(herdPlan.plan, "herd");
  fill(schedule.plan, "donkey");
  return Array.from(items.values());
}

// ── Feed Plan Edit Modal ──

function FeedPlanModal({
  initial,
  initialHerd,
  animalChoices,
  herdChoices,
  onClose,
  onSave,
}: {
  initial: ApiFeedEntry | null;
  initialHerd: ApiHerdPlan | null;
  animalChoices: string[];
  herdChoices: string[];
  onClose: () => void;
  onSave: (data: {
    scope: "animal" | "herd";
    herd?: string;
    targets: string[];
    plan: ApiFeedEntry["plan"];
    notes: string;
  }) => Promise<void>;
}) {
  // Scope: edit a single donkey (default) or the herd's shared base plan.
  // A herd plan is ONE row — donkeys keep their own rows as overrides on
  // top of it, so saving a herd plan never touches per-donkey plans.
  const [scope, setScope] = useState<"animal" | "herd">(
    initialHerd ? "herd" : "animal"
  );
  const [animal, setAnimal] = useState(initial?.animal ?? animalChoices[0] ?? "");
  const [herd, setHerd] = useState(initialHerd?.herd ?? herdChoices[0] ?? "");
  const [am, setAm] = useState((initial ?? initialHerd)?.plan.am ?? []);
  const [mid, setMid] = useState((initial ?? initialHerd)?.plan.mid ?? []);
  const [pm, setPm] = useState((initial ?? initialHerd)?.plan.pm ?? []);
  const [notes, setNotes] = useState((initial ?? initialHerd)?.notes ?? "");
  const [saving, setSaving] = useState(false);

  // Members of the currently selected herd (live roster from context).
  const { animals } = useAnimals();
  const herdMembers = useMemo(() => {
    if (scope !== "herd" || !herd) return [];
    return animals.filter((a) => a.herd === herd).map((a) => a.name);
  }, [scope, herd, animals]);

  async function handleSave() {
    let targets: string[] = [];
    if (scope === "herd") {
      if (!herd) return;
    } else {
      if (!animal) return;
      targets = [animal];
    }
    setSaving(true);
    try {
      await onSave({
        scope,
        herd: scope === "herd" ? herd : undefined,
        targets,
        plan: {
          am: am.filter((x) => x.item.trim().length > 0),
          mid: mid.filter((x) => x.item.trim().length > 0),
          pm: pm.filter((x) => x.item.trim().length > 0),
        },
        notes,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 print:hidden"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-sidebar px-5 py-4 flex items-center justify-between">
          <h3 className="font-bold text-white">
            {initialHerd
              ? `Edit herd plan — ${initialHerd.herd}`
              : initial
                ? "Edit feed plan"
                : "New feed plan"}
          </h3>
          <button onClick={onClose} className="text-cream/60 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Scope toggle — only shown when creating a new plan. */}
          {!initial && !initialHerd && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-1">
                Apply to
              </label>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setScope("animal")}
                  className={`flex-1 px-3 py-2 text-sm font-semibold rounded-lg border transition-colors ${
                    scope === "animal"
                      ? "bg-sidebar text-white border-sidebar"
                      : "bg-white text-charcoal border-card-border hover:bg-cream"
                  }`}
                >
                  One donkey
                </button>
                <button
                  onClick={() => setScope("herd")}
                  className={`flex-1 px-3 py-2 text-sm font-semibold rounded-lg border transition-colors ${
                    scope === "herd"
                      ? "bg-sidebar text-white border-sidebar"
                      : "bg-white text-charcoal border-card-border hover:bg-cream"
                  }`}
                >
                  Whole herd
                </button>
              </div>
            </div>
          )}

          {scope === "animal" ? (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-1">
                Animal
              </label>
              <select
                value={animal}
                onChange={(e) => setAnimal(e.target.value)}
                disabled={!!initial}
                className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-sand/50 disabled:opacity-60"
              >
                {animalChoices.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-1">
                Herd
              </label>
              <select
                value={herd}
                onChange={(e) => setHerd(e.target.value)}
                disabled={!!initialHerd}
                className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-sand/50 disabled:opacity-60"
              >
                {herdChoices.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              {herdMembers.length > 0 && (
                <p className="text-[11px] text-warm-gray/70 mt-1.5 leading-relaxed">
                  Shared base plan for {herdMembers.length} donkey{herdMembers.length === 1 ? "" : "s"}:{" "}
                  <span className="text-charcoal font-medium">{herdMembers.join(", ")}</span>.
                  Donkeys with their own plan keep it as an override on top of this.
                </p>
              )}
            </div>
          )}
          <MealEditor label="AM (Breakfast)" items={am} onChange={setAm} />
          <MealEditor label="Mid (Lunch)" items={mid} onChange={setMid} />
          <MealEditor label="PM (Dinner)" items={pm} onChange={setPm} />
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Special handling, e.g. soak for 10 min..."
              className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
            />
          </div>
        </div>
        <div className="px-5 py-4 border-t border-card-border flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-charcoal bg-white border border-card-border rounded-lg hover:bg-cream transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || (scope === "animal" ? !animal : !herd)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-sidebar rounded-lg hover:bg-sidebar-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Check className="w-4 h-4" />
            {saving
              ? "Saving..."
              : scope === "herd"
                ? "Save herd plan"
                : "Save plan"}
          </button>
        </div>
      </div>
    </div>
  );
}

function MealEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: { item: string; amount: string }[];
  onChange: (next: { item: string; amount: string }[]) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-1">
        {label}
      </label>
      <div className="space-y-2">
        {items.map((row, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={row.item}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...next[i], item: e.target.value };
                onChange(next);
              }}
              placeholder="Hay, teff, senior feed..."
              className="flex-1 px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
            />
            <input
              value={row.amount}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...next[i], amount: e.target.value };
                onChange(next);
              }}
              placeholder="1 flake"
              className="w-32 px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
            />
            <button
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="p-2 text-warm-gray hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Remove"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          onClick={() => onChange([...items, { item: "", amount: "" }])}
          className="inline-flex items-center gap-1 text-xs font-semibold text-sidebar hover:text-sidebar-light"
        >
          <Plus className="w-3.5 h-3.5" />
          Add item
        </button>
      </div>
    </div>
  );
}

// ── Feed Notes Section ──
// Notes persist as parking-lot entries (type "feed") with category on data.

function FeedNotesSection({
  notes,
  onAdd,
  onRemove,
}: {
  notes: { id: string; text: string; category: FeedNoteCategory }[];
  onAdd: (text: string, category: FeedNoteCategory) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState("");
  const [category, setCategory] = useState<FeedNoteCategory>("daily");
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    const text = draft.trim();
    if (!text) return;
    setSaving(true);
    try {
      await onAdd(text, category);
      setDraft("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 flex-wrap print:hidden">
        <span className="text-xs font-semibold uppercase tracking-wider text-warm-gray/60">Legend:</span>
        {Object.entries(noteStyles).map(([key, style]) => (
          <span key={key} className="inline-flex items-center gap-1.5 text-xs text-warm-gray">
            <span className={`w-2.5 h-2.5 rounded-full ${style.bg} border ${style.border}`} />
            {categoryLabels[key]}
          </span>
        ))}
      </div>

      {notes.map((note) => {
        const style = noteStyles[note.category] || noteStyles.daily;
        return (
          <div
            key={note.id}
            className={`group flex items-start gap-2 p-3 rounded-lg border ${style.bg} ${style.border}`}
          >
            <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${style.icon}`} />
            <div className="flex-1">
              <p className={`text-sm ${style.text}`}>{note.text}</p>
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${style.icon} mt-1 inline-block`}>
                {categoryLabels[note.category]}
              </span>
            </div>
            <button
              onClick={() => onRemove(note.id)}
              title="Remove note"
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-warm-gray/60 hover:text-red-500"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}

      {/* Add note */}
      <div className="flex items-center gap-2 p-2 bg-white border border-card-border rounded-lg print:hidden">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleAdd();
            }
          }}
          placeholder="Add a feed note..."
          className="flex-1 px-3 py-1.5 text-sm text-charcoal placeholder:text-warm-gray/50 focus:outline-none"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as FeedNoteCategory)}
          className="px-2 py-1.5 text-xs border border-card-border rounded-md bg-white text-charcoal"
        >
          <option value="daily">Daily</option>
          <option value="ongoing">Ongoing</option>
          <option value="evergreen">Permanent</option>
        </select>
        <button
          onClick={() => void handleAdd()}
          disabled={!draft.trim() || saving}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-sidebar text-white rounded-md text-xs font-semibold hover:bg-sidebar-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </button>
      </div>
    </div>
  );
}
