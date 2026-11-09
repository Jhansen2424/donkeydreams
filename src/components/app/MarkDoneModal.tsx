"use client";

import { useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { useMedical } from "@/lib/medical-context";
import { useToast } from "@/lib/toast-context";
import { formatDate } from "@/lib/format-date";
import { suggestedNextDue, treatmentTitle } from "@/lib/medical-status";
import type { MedicalEntry } from "@/lib/medical-data";

/* ── Mark a reminder done ──
   Client 11/6: "go into the overdue task and enter the date completed and
   schedule the next treatment" (Moses and Nelly Belle's vaccinations). */
export default function MarkDoneModal({
  record,
  todayIso,
  onClose,
}: {
  record: MedicalEntry;
  todayIso: string;
  onClose: () => void;
}) {
  const { entries, addEntry, updateEntry } = useMedical();
  const { toastSuccess, toastError } = useToast();
  const title = treatmentTitle(record);

  async function onSave(v: { date: string; notes: string; provider: string; nextDue: string }): Promise<boolean> {
    // A follow-up the app created becomes the completed record itself; a
    // built-in reminder gets a new record (and then counts as done).
    const isDb = entries.some((e) => e.id === record.id);
    const ok = isDb
      ? await updateEntry(record.id, { title, date: v.date, description: v.notes, provider: v.provider, urgent: false })
      : !!(await addEntry({ animal: record.animal, type: record.type, title, date: v.date, description: v.notes, provider: v.provider }));
    if (!ok) {
      toastError("Couldn't save. Check your signal and try again.");
      return false;
    }
    if (v.nextDue) {
      const next = await addEntry({
        animal: record.animal,
        type: record.type,
        title: `${title} — follow-up`,
        date: v.nextDue,
        description: `Scheduled follow-up for ${record.type.toLowerCase()} on ${v.date}.`,
      });
      if (!next) {
        toastError(`${title} marked done for ${record.animal}, but the next reminder didn't save. Add it again from the Medical page.`);
        onClose();
        return true;
      }
    }
    toastSuccess(`${title} marked done for ${record.animal}${v.nextDue ? `. Next one due ${formatDate(v.nextDue)}.` : "."}`);
    onClose();
    return true;
  }
  const [date, setDate] = useState(todayIso);
  const [notes, setNotes] = useState("");
  const [provider, setProvider] = useState(record.provider ?? "");
  const [nextDue, setNextDue] = useState(() => suggestedNextDue(record.type, title, todayIso));
  const [nextTouched, setNextTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const field =
    "w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50";
  const label = "block text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-1";

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-sidebar px-5 py-4 flex items-center justify-between">
          <h2 className="font-bold text-white">
            Mark done: {title} for {record.animal}
          </h2>
          <button onClick={onClose} className="text-cream/60 hover:text-white p-1" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-warm-gray">
            Was due {formatDate(record.date)}. This saves it to {record.animal}&apos;s medical record.
          </p>
          <div>
            <label className={label}>Date given</label>
            <input
              type="date"
              value={date}
              max={todayIso}
              onChange={(e) => {
                setDate(e.target.value);
                if (!nextTouched && e.target.value) setNextDue(suggestedNextDue(record.type, title, e.target.value));
              }}
              className={field}
            />
          </div>
          <div>
            <label className={label}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Product, lot number, anything worth remembering"
              className={field}
            />
          </div>
          <div>
            <label className={label}>Given by (optional)</label>
            <input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="e.g. Amber or the vet" className={field} />
          </div>
          <div>
            <label className={label}>Next one due (optional)</label>
            <input
              type="date"
              value={nextDue}
              min={date || todayIso}
              onChange={(e) => {
                setNextDue(e.target.value);
                setNextTouched(true);
              }}
              className={field}
            />
            <p className="text-[11px] text-warm-gray/70 mt-1">Adds a reminder on that date. Leave blank for none.</p>
          </div>
        </div>
        <div className="px-5 py-4 border-t border-card-border flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-charcoal bg-white border border-card-border rounded-lg hover:bg-cream"
          >
            Cancel
          </button>
          <button
            disabled={!date || saving}
            onClick={async () => {
              setSaving(true);
              const ok = await onSave({ date, notes: notes.trim(), provider: provider.trim(), nextDue });
              if (!ok) setSaving(false);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-40"
          >
            <CheckCircle2 className="w-4 h-4" />
            {saving ? "Saving..." : "Mark done"}
          </button>
        </div>
      </div>
    </div>
  );
}
