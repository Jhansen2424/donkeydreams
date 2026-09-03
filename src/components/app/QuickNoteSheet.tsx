"use client";

// Quick Note — a bottom sheet (mobile) / dialog (desktop) for jotting a note
// WITHOUT leaving the current page. It knows where you are: on a donkey's
// profile the note is pre-tagged with that donkey (one tap to remove), and
// every note stores the page it was written from so the Notes inbox can jump
// back there. A half-typed note survives interruptions via a local draft.

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { X, Check, MapPin, Mic, Loader2, Paperclip } from "lucide-react";
import { useParkingLot, type EntryType } from "@/lib/parking-lot-context";
import { useAnimals } from "@/lib/animals-context";
import { useToast } from "@/lib/toast-context";
import { compressImage } from "@/lib/trim-photos";

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
  // Pending attachments — held locally (compressed data URLs) and only
  // uploaded when the note is actually saved, so closing the sheet never
  // leaves orphaned files behind.
  const [attachments, setAttachments] = useState<
    Array<{ name: string; mimeType: string; dataUrl: string }>
  >([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const attachInputRef = useRef<HTMLInputElement>(null);

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
    setAttachments([]);
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

  const addFiles = async (files: FileList) => {
    for (const file of Array.from(files)) {
      try {
        if (file.type.startsWith("image/")) {
          const dataUrl = await compressImage(file, 1280, 0.75);
          setAttachments((prev) => [
            ...prev,
            {
              name: file.name.replace(/\.[a-z0-9]+$/i, "") + ".jpg",
              mimeType: "image/jpeg",
              dataUrl,
            },
          ]);
        } else if (file.size <= 4 * 1024 * 1024) {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result as string);
            r.onerror = () => reject(r.error);
            r.readAsDataURL(file);
          });
          setAttachments((prev) => [
            ...prev,
            { name: file.name, mimeType: file.type || "application/octet-stream", dataUrl },
          ]);
        }
      } catch {
        // Unreadable file — skip it quietly.
      }
    }
  };

  // Attachments live in a dedicated Documents folder so they're visible but
  // out of the way; the parking-lot API deletes them when the note is
  // resolved or removed.
  const uploadAttachments = async (): Promise<string[]> => {
    if (attachments.length === 0) return [];
    let folderId: string | null = null;
    const rootRes = await fetch("/api/documents", { cache: "no-store" });
    if (rootRes.ok) {
      const root = (await rootRes.json()) as { folders: Array<{ id: string; name: string }> };
      folderId = root.folders.find((f) => f.name === "Note Attachments")?.id ?? null;
    }
    if (!folderId) {
      const created = await fetch("/api/documents/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Note Attachments" }),
      });
      if (created.ok) folderId = ((await created.json()) as { folder: { id: string } }).folder.id;
    }
    const ids: string[] = [];
    for (const a of attachments) {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: a.name,
          folderId,
          mimeType: a.mimeType,
          dataBase64: a.dataUrl.slice(a.dataUrl.indexOf(",") + 1),
        }),
      });
      if (res.ok) {
        ids.push(((await res.json()) as { document: { id: string } }).document.id);
      }
    }
    return ids;
  };

  const save = async () => {
    if (!text.trim() || saving) return;
    setSaving(true);
    try {
      const attachmentIds = await uploadAttachments();
      await addEntry(category, text.trim(), {
        ...(animal && tagAnimal ? { animal: animal.name } : {}),
        ...(category === "watch" ? { severity: "medium" as const } : {}),
        ...(attachmentIds.length > 0 ? { attachments: attachmentIds } : {}),
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

          {/* Pending attachments */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachments.map((a, i) => (
                <span
                  key={i}
                  className="relative inline-flex items-center gap-1.5 bg-cream rounded-lg px-2 py-1.5 text-[11px] text-charcoal max-w-[160px]"
                >
                  {a.mimeType.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.dataUrl} alt={a.name} className="w-8 h-8 object-cover rounded" />
                  ) : (
                    <Paperclip className="w-3.5 h-3.5 text-warm-gray shrink-0" />
                  )}
                  <span className="truncate">{a.name}</span>
                  <button
                    onClick={() => setAttachments((prev) => prev.filter((_, x) => x !== i))}
                    className="text-warm-gray/60 hover:text-red-500 shrink-0"
                    aria-label={`Remove ${a.name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {onVoice && (
                <button
                  onClick={onVoice}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-charcoal bg-white border border-card-border rounded-lg hover:bg-cream transition-colors"
                  title="Dictate with Joshy instead"
                >
                  <Mic className="w-4 h-4" />
                  Voice
                </button>
              )}
              <button
                onClick={() => attachInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-charcoal bg-white border border-card-border rounded-lg hover:bg-cream transition-colors"
                title="Attach a screenshot, photo, or document"
              >
                <Paperclip className="w-4 h-4" />
                Attach
              </button>
              <input
                ref={attachInputRef}
                type="file"
                accept="image/*,application/pdf"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) void addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>
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
