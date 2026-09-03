"use client";

// Quick Note — a bottom sheet (mobile) / dialog (desktop) for jotting a note
// WITHOUT leaving the current page. It knows where you are: on a donkey's
// profile the note is pre-tagged with that donkey (one tap to remove), and
// every note stores the page it was written from so the Notes inbox can jump
// back there. A half-typed note survives interruptions via a local draft.

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { X, Check, MapPin, Mic, Loader2 } from "lucide-react";
import { useParkingLot, type EntryType } from "@/lib/parking-lot-context";
import { useAnimals } from "@/lib/animals-context";
import { useToast } from "@/lib/toast-context";

const DRAFT_KEY = "dd:quicknote-draft:v1";

const CATEGORIES: Array<{ id: EntryType; label: string; cls: string }> = [
  { id: "note", label: "Note", cls: "bg-sky/10 text-sky-dark border-sky/30" },
  { id: "developer", label: "Dev note", cls: "bg-purple-50 text-purple-700 border-purple-200" },
  { id: "watch", label: "Watch", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "task", label: "Task", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "feed", label: "Feed", cls: "bg-orange-50 text-orange-700 border-orange-200" },
];

const PAGE_LABELS: Record<string, string> = {
  "/app": "Dashboard",
  "/app/animals": "Animals list",
  "/app/tasks": "Daily Routine",
  "/app/feed": "Feed Plans",
  "/app/hoof-dental": "Hoof & Dental",
  "/app/medical": "Medical",
  "/app/weight": "Weight Tracking",
  "/app/map": "Map",
  "/app/documents": "Documents",
  "/app/notes": "Notes",
  "/app/watch": "Watch List",
  "/app/updates": "Sanctuary Updates",
};

interface Draft {
  text?: string;
  category?: EntryType;
}

function loadDraft(): Draft {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "{}") as Draft;
  } catch {
    return {};
  }
}

export default function QuickNoteSheet({
  open,
  onClose,
  onVoice,
}: {
  open: boolean;
  onClose: () => void;
  /** Hand off to the Joshy voice modal instead. */
  onVoice?: () => void;
}) {
  const pathname = usePathname();
  const { getBySlug } = useAnimals();
  const { addEntry } = useParkingLot();
  const { toastSuccess } = useToast();

  const [text, setText] = useState("");
  const [category, setCategory] = useState<EntryType>("note");
  const [tagAnimal, setTagAnimal] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Where are we? On a profile, resolve the donkey from the URL slug.
  const profileSlug = pathname?.match(/^\/app\/animals\/([^/?]+)/)?.[1] ?? null;
  const animal = profileSlug ? getBySlug(decodeURIComponent(profileSlug)) : undefined;
  const basePath = pathname?.split("?")[0] ?? "/app";
  const sourceLabel = animal
    ? `${animal.name}'s profile`
    : PAGE_LABELS[basePath] ?? basePath.replace("/app/", "").replace(/-/g, " ");

  // Restore any interrupted draft when the sheet opens.
  useEffect(() => {
    if (!open) return;
    const draft = loadDraft();
    if (draft.text) {
      setText(draft.text);
      if (draft.category) setCategory(draft.category);
      setDraftRestored(true);
    } else {
      setText("");
      setCategory("note");
      setDraftRestored(false);
    }
    setTagAnimal(true);
    setSaving(false);
    requestAnimationFrame(() => textareaRef.current?.focus());
  }, [open]);

  // Keep the draft in sync while typing (survives closing/backgrounding).
  useEffect(() => {
    if (!open) return;
    try {
      if (text.trim()) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ text, category } satisfies Draft));
      } else {
        localStorage.removeItem(DRAFT_KEY);
      }
    } catch {
      // Storage unavailable — draft just won't persist.
    }
  }, [text, category, open]);

  if (!open) return null;

  const save = async () => {
    if (!text.trim() || saving) return;
    setSaving(true);
    try {
      await addEntry(category, text.trim(), {
        ...(animal && tagAnimal ? { animal: animal.name } : {}),
        ...(category === "watch" ? { severity: "medium" as const } : {}),
        sourcePath: pathname ?? undefined,
        sourceLabel,
      });
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        // ignore
      }
      setText("");
      toastSuccess("Note saved — you're right where you were.");
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-sidebar px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-white">Quick Note</h2>
            <p className="text-[11px] text-cream/70 mt-0.5 inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {sourceLabel}
            </p>
          </div>
          <button onClick={onClose} className="text-cream/60 hover:text-white p-1" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {/* Category chips */}
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                  category === c.id ? c.cls : "bg-white text-warm-gray border-card-border hover:bg-cream"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Animal tag from context */}
          {animal && (
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-warm-gray/70">About:</span>
              {tagAnimal ? (
                <span className="inline-flex items-center gap-1 font-semibold text-sky-dark bg-sky/10 px-2 py-0.5 rounded-full">
                  {animal.name}
                  <button
                    onClick={() => setTagAnimal(false)}
                    className="text-sky-dark/60 hover:text-red-500"
                    title={`This note isn't about ${animal.name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => setTagAnimal(true)}
                  className="text-sky-600 hover:underline font-medium"
                >
                  tag {animal.name}
                </button>
              )}
            </div>
          )}

          {draftRestored && (
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
              Picked up where you left off — this draft was saved automatically.
            </p>
          )}

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder={
              category === "developer"
                ? "What's broken or what do you need? The page you're on is attached automatically."
                : "Type your note…"
            }
            className="w-full px-3 py-2.5 text-base border border-card-border rounded-lg text-charcoal placeholder:text-warm-gray/50 focus:outline-none focus:ring-2 focus:ring-sand/50 resize-none"
          />

          <div className="flex items-center justify-between gap-2">
            {onVoice ? (
              <button
                onClick={onVoice}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-charcoal bg-white border border-card-border rounded-lg hover:bg-cream transition-colors"
                title="Dictate with Joshy instead"
              >
                <Mic className="w-4 h-4" />
                Voice
              </button>
            ) : (
              <span />
            )}
            <button
              onClick={() => void save()}
              disabled={!text.trim() || saving}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white bg-sidebar rounded-lg hover:bg-sidebar-light disabled:opacity-40 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
