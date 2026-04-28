"use client";

import { useState } from "react";
import { Sparkles, Plus, Trash2, Loader2, Check, X } from "lucide-react";
import { useParkingLot } from "@/lib/parking-lot-context";
import { formatDate as sharedFormatDate } from "@/lib/format-date";

// MM-DD-YYYY h:mm AM/PM, e.g. "04-28-2026 3:14 PM"
function formatTimestamp(d: Date): string {
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${sharedFormatDate(d)} ${time}`;
}

export default function SanctuaryUpdatesPage() {
  const { entries, addEntry, removeEntry, loading, error } = useParkingLot();
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  // Updates are stored as parking-lot entries with type="update". They
  // stay visible whether resolved or not — the "resolved" flag isn't
  // meaningful for log-style updates.
  const updates = entries
    .filter((e) => e.type === "update")
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const submit = async () => {
    const text = draft.trim();
    if (!text || saving) return;
    setSaving(true);
    try {
      await addEntry("update", text);
      setDraft("");
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald-500" />
            Sanctuary Updates
          </h1>
          <p className="text-sm text-warm-gray mt-1">
            Running log of sanctuary-wide updates. Newest at the top.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-sidebar text-white rounded-lg text-sm font-medium hover:bg-sidebar-light transition-colors self-start"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancel" : "New update"}
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl border border-card-border p-5 space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-warm-gray/60">
            What happened?
          </label>
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            placeholder="e.g. Welcomed three new intakes from the rescue in Yuma. Winky moved into the senior barn."
            className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal placeholder:text-warm-gray/50 focus:outline-none focus:ring-2 focus:ring-sand/50 resize-none"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setDraft("");
                setShowForm(false);
              }}
              className="px-4 py-2 text-sm font-medium text-charcoal bg-white border border-card-border rounded-lg hover:bg-cream transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={!draft.trim() || saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-sidebar rounded-lg hover:bg-sidebar-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Post update
            </button>
          </div>
        </div>
      )}

      {loading && updates.length === 0 && (
        <div className="bg-white rounded-xl border border-card-border p-10 text-center">
          <Loader2 className="w-8 h-8 text-warm-gray/40 mx-auto mb-3 animate-spin" />
          <p className="text-sm text-warm-gray">Loading updates...</p>
        </div>
      )}

      {!loading && updates.length === 0 && !showForm && (
        <div className="bg-white rounded-xl border border-card-border p-10 text-center">
          <Sparkles className="w-10 h-10 text-warm-gray/40 mx-auto mb-3" />
          <p className="text-charcoal font-semibold mb-1">No updates yet</p>
          <p className="text-sm text-warm-gray">
            Tap &ldquo;New update&rdquo; to post the first one.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {updates.map((u) => (
          <div
            key={u.id}
            className="bg-white rounded-xl border border-emerald-200 p-4 flex items-start gap-3"
          >
            <Sparkles className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                {formatTimestamp(u.timestamp)}
              </p>
              <p className="text-sm text-charcoal leading-relaxed mt-1 whitespace-pre-wrap">
                {u.text}
              </p>
            </div>
            <button
              onClick={() => removeEntry(u.id)}
              className="p-1.5 text-warm-gray/50 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Delete update"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
