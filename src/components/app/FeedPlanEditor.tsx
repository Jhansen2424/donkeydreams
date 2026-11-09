"use client";

// The feed plan editor, shared by the Feed Plans page and each donkey's
// Feed Plan tab (client 11/6: Michelle couldn't edit feed plans from where
// she was working). saveFeedPlan throws when the server doesn't confirm the
// save, so the editor stays open with the changes instead of quietly
// closing as if it had worked.

import { useMemo, useState } from "react";
import { Plus, X, Check, Trash2 } from "lucide-react";
import { useAnimals } from "@/lib/animals-context";

export interface ApiFeedEntry {
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
export interface ApiHerdPlan {
  id: string;
  herd: string;
  notes: string;
  plan: ApiFeedEntry["plan"];
}

export interface FeedPlanSave {
  scope: "animal" | "herd";
  herd?: string;
  targets: string[];
  plan: ApiFeedEntry["plan"];
  notes: string;
}

/** Save a feed plan (one donkey's, or a herd's base plan). Throws if any
 *  save isn't confirmed by the server. */
export async function saveFeedPlan(data: FeedPlanSave): Promise<void> {
  const post = async (url: string, body: unknown) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const msg = await res.json().then((b) => b?.error).catch(() => null);
      throw new Error(msg || "The feed plan didn't save.");
    }
  };
  if (data.scope === "herd" && data.herd) {
    // One herd-level row; per-donkey rows stay untouched and act as
    // overrides/additions on top of it.
    await post("/api/feed/herd", { herd: data.herd, plan: data.plan, notes: data.notes });
  } else {
    for (const animal of data.targets) {
      await post("/api/feed", { animal, plan: data.plan, notes: data.notes });
    }
  }
}

// ── Feed Plan Edit Modal ──

export function FeedPlanModal({
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

  // Unsaved-work guard: a stray tap/scroll outside the window must never
  // throw away a half-typed feed plan (it did — client lost Elanora's plan
  // twice on 9/6). Once anything differs from what the modal opened with,
  // clicking the backdrop does nothing and the X asks first.
  const initialSnapshot = useState(() =>
    JSON.stringify({
      am: (initial ?? initialHerd)?.plan.am ?? [],
      mid: (initial ?? initialHerd)?.plan.mid ?? [],
      pm: (initial ?? initialHerd)?.plan.pm ?? [],
      notes: (initial ?? initialHerd)?.notes ?? "",
    })
  )[0];
  const isDirty =
    JSON.stringify({ am, mid, pm, notes }) !== initialSnapshot;
  const requestClose = () => {
    if (!isDirty || window.confirm("Discard your unsaved feed plan changes?")) {
      onClose();
    }
  };

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
    } catch {
      // The caller shows the error; the editor stays open with the changes.
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 print:hidden"
      onClick={() => {
        // Backdrop click only closes a PRISTINE modal — with unsaved edits
        // it's ignored entirely (no confirm spam from accidental taps).
        if (!isDirty) onClose();
      }}
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
          <button onClick={requestClose} className="text-cream/60 hover:text-white p-1">
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
            onClick={requestClose}
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
