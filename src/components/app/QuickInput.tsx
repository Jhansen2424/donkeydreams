"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Send,
  Mic,
  MicOff,
  ClipboardCheck,
  Stethoscope,
  UtensilsCrossed,
  AlertTriangle,
  StickyNote,
  ChevronDown,
  Sparkles,
  Loader2,
  Check,
  Pencil,
  Trash2,
} from "lucide-react";
import { useParkingLot, type EntryType } from "@/lib/parking-lot-context";
import { useSchedule } from "@/lib/schedule-context";
import { useMedical } from "@/lib/medical-context";
import { useToast } from "@/lib/toast-context";
import { animals } from "@/lib/animals";
import type { MedicalEntryType } from "@/lib/medical-data";

const sortedAnimals = [...animals].sort((a, b) => a.name.localeCompare(b.name));

const tabs: { id: EntryType | "joshy"; label: string; icon: typeof ClipboardCheck; color: string }[] = [
  { id: "joshy", label: "Joshy AI", icon: Sparkles, color: "bg-sidebar" },
  { id: "task", label: "Task", icon: ClipboardCheck, color: "bg-sky" },
  { id: "medical", label: "Medical", icon: Stethoscope, color: "bg-purple-500" },
  { id: "feed", label: "Feed", icon: UtensilsCrossed, color: "bg-amber-500" },
  { id: "watch", label: "Watch", icon: AlertTriangle, color: "bg-red-500" },
];

const actionLabels: Record<string, { label: string; icon: typeof ClipboardCheck; color: string }> = {
  task: { label: "Task", icon: ClipboardCheck, color: "text-sky-700" },
  watch: { label: "Watch Alert", icon: AlertTriangle, color: "text-red-700" },
  medical: { label: "Medical Entry", icon: Stethoscope, color: "text-purple-700" },
  feed: { label: "Feed Note", icon: UtensilsCrossed, color: "text-amber-700" },
  note: { label: "Note", icon: StickyNote, color: "text-warm-gray" },
  query: { label: "Answer", icon: Sparkles, color: "text-sidebar" },
  edit_task: { label: "Edit Task", icon: Pencil, color: "text-sky-700" },
  delete_task: { label: "Delete Task", icon: Trash2, color: "text-red-700" },
  set_hoof_date: { label: "Next Hoof Trim", icon: Stethoscope, color: "text-amber-700" },
  set_dental_date: { label: "Next Dental Visit", icon: Stethoscope, color: "text-amber-700" },
  weight_bcs: { label: "Weight / BCS", icon: Stethoscope, color: "text-slate-700" },
  log_hoof_visit: { label: "Hoof Trim Done", icon: Stethoscope, color: "text-amber-700" },
  log_dental_visit: { label: "Dental Visit Done", icon: Stethoscope, color: "text-amber-700" },
  complete_task: { label: "Task Complete", icon: Check, color: "text-green-700" },
  resolve_watch: { label: "Resolve Watch", icon: Check, color: "text-green-700" },
  set_vaccination_date: { label: "Next Vaccination", icon: Stethoscope, color: "text-amber-700" },
  set_feed_plan: { label: "Feed Plan", icon: UtensilsCrossed, color: "text-amber-700" },
  update_animal: { label: "Update Animal", icon: Pencil, color: "text-sidebar" },
  edit_medical: { label: "Edit Medical", icon: Pencil, color: "text-purple-700" },
  delete_medical: { label: "Delete Medical", icon: Trash2, color: "text-red-700" },
  delete_watch: { label: "Delete Watch", icon: Trash2, color: "text-red-700" },
  edit_weight_bcs: { label: "Edit Weight / BCS", icon: Pencil, color: "text-slate-700" },
  delete_weight_bcs: { label: "Delete Weight / BCS", icon: Trash2, color: "text-red-700" },
  edit_feed: { label: "Edit Feed Note", icon: Pencil, color: "text-amber-700" },
  delete_feed: { label: "Delete Feed Note", icon: Trash2, color: "text-red-700" },
  delete_feed_plan: { label: "Delete Feed Plan", icon: Trash2, color: "text-red-700" },
  log_temperature: { label: "Temperature", icon: Stethoscope, color: "text-red-700" },
  log_fecal_test: { label: "Fecal Test", icon: Stethoscope, color: "text-teal-700" },
  log_provider_visit: { label: "Provider Visit", icon: Stethoscope, color: "text-sky-700" },
  add_volunteer: { label: "Add Volunteer", icon: Sparkles, color: "text-sidebar" },
  update_volunteer: { label: "Update Volunteer", icon: Pencil, color: "text-sidebar" },
  delete_volunteer: { label: "Delete Volunteer", icon: Trash2, color: "text-red-700" },
  add_article: { label: "Add Article", icon: StickyNote, color: "text-sky-700" },
  update_article: { label: "Edit Article", icon: Pencil, color: "text-sky-700" },
  delete_article: { label: "Delete Article", icon: Trash2, color: "text-red-700" },
};

function getCurrentTimeBlock(): string {
  const hour = new Date().getHours();
  if (hour < 10) return "AM";
  if (hour < 16) return "Mid";
  return "PM";
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

// When a multi-animal dispatch (log_hoof_visit, log_provider_visit, etc.)
// receives an `animals` array, expand any herd-name entries into the actual
// list of donkeys in that herd. This lets users say "the whole Pegasus herd"
// without Joshy needing to enumerate. Unknown entries pass through unchanged
// so the calling dispatcher can warn/skip them.
const HERD_KEYWORDS: Record<string, string> = {
  "elsie's herd": "Elsie's Herd",
  "elsies herd": "Elsie's Herd",
  "elsie herd": "Elsie's Herd",
  "brave": "Brave",
  "brave herd": "Brave",
  "unicorns": "Unicorns",
  "pegasus": "Pegasus",
  "pegasus herd": "Pegasus",
  "seniors": "Seniors",
  "senior": "Seniors",
  "senior herd": "Seniors",
  "pinky's herd": "Pinky's Herd",
  "pinkys herd": "Pinky's Herd",
  "pinks herd": "Pinky's Herd",
  "pink": "Pinky's Herd",
  "pinky": "Pinky's Herd",
  "dragons": "Dragons",
  "angels": "Angels",
  "angel herd": "Angels",
  "legacy": "Legacy",
};

function expandHerdNames(
  list: string[],
  allAnimals: { name: string; herd: string }[]
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of list) {
    const trimmed = item.trim();
    const herdMatch = HERD_KEYWORDS[trimmed.toLowerCase()];
    if (herdMatch) {
      // It's a herd keyword — expand to all animals in that herd.
      for (const a of allAnimals) {
        if (a.herd === herdMatch && !seen.has(a.name)) {
          seen.add(a.name);
          out.push(a.name);
        }
      }
    } else if (!seen.has(trimmed)) {
      seen.add(trimmed);
      out.push(trimmed);
    }
  }
  return out;
}

// Combined helper used by every multi-animal dispatch case. Picks the
// `animals` array if non-empty, falls back to the singular `animal`, then
// expands herd keywords like "Pegasus" or "the Seniors" into the actual
// list of donkeys in that herd.
function resolveAnimalTargets(
  data: { animal?: string | null; animals?: string[] | null },
  allAnimals: { name: string; herd: string }[]
): string[] {
  const initial =
    Array.isArray(data.animals) && data.animals.length > 0
      ? data.animals
      : data.animal
        ? [data.animal]
        : [];
  return expandHerdNames(initial, allAnimals);
}

// Map a free-text medical note to one of the MedicalEntry types.
// Joshy doesn't return the type explicitly, so we infer from keywords.
function inferMedicalType(text: string, title?: string | null): MedicalEntryType {
  const haystack = `${title ?? ""} ${text}`.toLowerCase();
  if (/\b(deworm|dewormed|dewormer|ivermectin|moxidectin|pyrantel|fenbendazole|tri-?wormer|power.?pack)\b/.test(haystack))
    return "Deworming";
  if (/\b(vaccin|vaccine|ewt|west nile|rabies|flu|tetanus|encephalitis|booster)\b/.test(haystack))
    return "Vaccination";
  if (/\b(fecal|egg count|parasite test|strongyle)\b/.test(haystack))
    return "Fecal Test";
  if (/\b(hoof|trim|farrier|dental|float|teeth)\b/.test(haystack))
    return "Hoof & Dental";
  if (/\b(temp|temperature|fever|°f|°c|degrees)\b/.test(haystack))
    return "Temperature";
  if (/\b(weight|weigh|lbs|pounds|kg)\b/.test(haystack) && /\b(today|was|is)\b/.test(haystack))
    return "Weight";
  if (/\b(blood|lab|urinalysis|cbc|chem panel|test result|panel)\b/.test(haystack))
    return "Lab Result";
  if (/\b(bute|banamine|equioxx|flunixin|medication|dose|mg|ml|antibiotic|bandage|wrap|ointment|adjust(ed)? .*(bute|med))\b/.test(haystack))
    return "Medication";
  return "Vet Visit";
}

// Cheap client-side classifier: does this utterance likely need the live
// schedule/parking-lot context? Queries, edits, and deletes do — they reference
// existing items. Plain creates ("Fernie's bandage needs changing") don't.
// Skipping the payload when not needed saves ~1500 tokens per request, which
// roughly triples the daily Groq free-tier budget.
function needsLiveContext(text: string): boolean {
  const t = text.toLowerCase();
  const queryWords = /\b(what|who|when|where|which|how|how many|is|are|was|were|show|list|tell me|any|anything|anyone|currently|right now|today|assigned|left|remaining|urgent)\b/;
  const editWords = /\b(change|move|reassign|rename|update|edit|replace|swap)\b/;
  const deleteWords = /\b(delete|remove|cancel|drop|get rid of|take off|clear|unassign)\b/;
  const referenceWords = /\b(that task|the task|this task|it instead|that one|existing)\b/;
  return queryWords.test(t) || editWords.test(t) || deleteWords.test(t) || referenceWords.test(t);
}

// ── AI parsed result type ──
interface JoshyResult {
  action: string;
  confidence: number;
  summary: string;
  data: {
    text: string;
    animal?: string | null;
    assignee?: string | null;
    timeBlock?: string | null;
    severity?: string | null;
    title?: string | null;
    date?: string | null;
    provider?: string | null;
    weight?: number | null;
    bcs?: number | null;
    blockIdx?: number | null;
    taskIdx?: number | null;
    entryIdx?: number | null;
    notes?: string | null;
    nextDate?: string | null;
    planMode?: "replace" | "merge" | null;
    amPlan?: { item: string; amount: string }[] | null;
    midPlan?: { item: string; amount: string }[] | null;
    pmPlan?: { item: string; amount: string }[] | null;
    feedNotes?: string | null;
    animalField?: string | null;
    animalValue?: string | number | boolean | string[] | null;
    animalMode?: "add" | "remove" | "replace" | null;
    // Phase 4: target identifiers for edit/delete of existing records.
    // medIdx indexes into LIVE STATE's `medical` array; entryIdx already
    // covers parking-lot entries (watch/feed notes). For weight records we
    // identify by animal + date instead of an idx, since weight logs aren't
    // pre-loaded into live state.
    medIdx?: number | null;
    // For set_feed_plan / delete_feed_plan we already use `animal` directly.
    // Phase 5: structured logs.
    tempF?: number | null; // body temperature in °F for log_temperature
    eggCount?: number | null; // fecal egg count (epg) for log_fecal_test
    labName?: string | null; // lab that processed the fecal sample
    animals?: string[] | null; // multi-animal provider visit list
    // Phase 6: admin (volunteers + knowledge base).
    volunteerEmail?: string | null; // identifies an existing volunteer for edit/delete
    volunteerName?: string | null;
    volunteerPhone?: string | null;
    volunteerRole?: "admin" | "volunteer" | null;
    volunteerStatus?: "active" | "inactive" | "pending" | null;
    volunteerSkills?: string[] | null;
    volunteerAvailability?: string[] | null;
    volunteerNotes?: string | null;
    volunteerArrayMode?: "add" | "remove" | "replace" | null; // applies to skills + availability
    category?: string | null; // TaskCategory for task creation

    articleTitle?: string | null; // identifies an existing article for edit/delete
    articleNewTitle?: string | null; // when renaming
    articleContent?: string | null;
    articleTags?: string[] | null;
    articleLinkedAnimals?: string[] | null;
  };
  clarify?: string | null;
}

// ── Voice-to-text hook ──
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionInstance = any;

function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const SpeechRecognitionCtor = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (SpeechRecognitionCtor) {
      setSupported(true);
      const recognition = new SpeechRecognitionCtor();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let text = "";
        for (let i = 0; i < event.results.length; i++) {
          text += event.results[i][0].transcript;
        }
        setTranscript(text);
      };

      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      setTranscript("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  return { isListening, transcript, supported, startListening, stopListening };
}

// ── Main Component ──
export default function QuickInput({
  open,
  onClose,
  autoVoice = false,
  initialText = "",
}: {
  open: boolean;
  onClose: () => void;
  // When true, the modal opens directly into voice dictation
  // (used by the "Hey Joshy" wake-word flow).
  autoVoice?: boolean;
  // When provided alongside autoVoice, skip dictation and submit this text
  // to Joshy immediately. Used when the wake listener captures everything
  // the user said in the same utterance ("hey joshy <the note>").
  initialText?: string;
}) {
  const {
    addEntry,
    entries,
    resolveEntry,
    updateEntry: updateParkingLotEntry,
    removeEntry: removeParkingLotEntry,
  } = useParkingLot();
  const { toastError, toastSuccess } = useToast();
  const {
    addEntry: addMedicalEntry,
    updateEntry: updateMedicalEntry,
    removeEntry: removeMedicalEntry,
    entries: medicalEntries,
  } = useMedical();
  const { addTask, editTask, deleteTask, toggleTask, schedule } = useSchedule();
  const [activeTab, setActiveTab] = useState<EntryType | "joshy">("joshy");
  const [text, setText] = useState("");

  // Structured form fields (for manual tabs)
  const [animal, setAnimal] = useState("");
  const [timeBlock, setTimeBlock] = useState(getCurrentTimeBlock());
  const [assignee, setAssignee] = useState("");
  const [severity, setSeverity] = useState<"high" | "medium" | "low">("medium");
  const [date, setDate] = useState(todayISO());

  // AI state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<JoshyResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Hands-free voice flow state
  const [voiceMode, setVoiceMode] = useState(false);
  const prevListeningRef = useRef(false);
  const confirmHandledRef = useRef(false);
  // Cumulative conversation context: original note + any clarifications.
  // Used so that follow-up answers from the user are sent back to Joshy
  // along with the original utterance.
  const noteContextRef = useRef("");

  // Voice
  const { isListening, transcript, supported, startListening, stopListening } =
    useSpeechRecognition();

  // Sync transcript into text field — but NOT during the confirm phase,
  // where the transcript is "yes"/"no" and shouldn't overwrite the note.
  useEffect(() => {
    if (!transcript) return;
    if (voiceMode && aiResult) return;
    setText((prev) => (prev && !isListening ? prev : transcript));
  }, [transcript, isListening, voiceMode, aiResult]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setText("");
      setAnimal("");
      setTimeBlock(getCurrentTimeBlock());
      setAssignee("");
      setSeverity("medium");
      setDate(todayISO());
      setAiResult(null);
      setAiError(null);
      setVoiceMode(false);
      confirmHandledRef.current = false;
      noteContextRef.current = "";
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
  }, [open]);

  // ── Build a compact snapshot of today's live state for Joshy queries ──
  // Build a compact snapshot of today's live state. We preserve original
  // blockIdx/taskIdx values even after filtering out done tasks, so Joshy's
  // returned indices still point at the correct item in the full schedule.
  const buildLiveContext = useCallback(() => {
    return {
      now: new Date().toISOString(),
      schedule: schedule.map((block, blockIdx) => ({
        blockIdx,
        block: block.name,
        time: block.time,
        tasks: block.tasks
          .map((t, taskIdx) => ({ t, taskIdx }))
          .filter(({ t }) => !t.done)
          .map(({ t, taskIdx }) => ({
            taskIdx,
            task: t.task,
            assignee: t.assignedTo || null,
            animal: t.animalSpecific || null,
          })),
      })),
      // Preserve original array indices even after filtering out resolved
      // entries so Joshy's returned entryIdx still points at the correct item.
      parkingLot: entries
        .map((e, entryIdx) => ({ e, entryIdx }))
        .filter(({ e }) => !e.resolved)
        .map(({ e, entryIdx }) => ({
          entryIdx,
          type: e.type,
          text: e.text,
          animal: e.data?.animal || null,
          assignee: e.data?.assignee || null,
          severity: e.data?.severity || null,
        })),
      // DB-backed medical entries (most recent 20). CSV-derived entries are
      // NOT included — they have no editable DB row. medIdx is the index into
      // this sliced array, so edit/delete actions can round-trip the id.
      medical: medicalEntries
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 20)
        .map((m, medIdx) => ({
          medIdx,
          id: m.id,
          animal: m.animal,
          type: m.type,
          title: m.title,
          date: m.date,
          description: m.description?.slice(0, 120) ?? "",
          urgent: m.urgent,
        })),
    };
  }, [schedule, entries, medicalEntries]);

  // ── AI Submit ──
  // isFollowUp = true means `raw` is the user's spoken answer to a previous
  // clarifying question. We append it to the running conversation context
  // so Joshy gets both the original note and the clarification.
  // retryWithContext = true forces sending live state even if the classifier
  // thought it wasn't needed (used when Joshy's first response signals it
  // needed to see the schedule).
  const submitToJoshy = useCallback(async (raw: string, isFollowUp = false, retryWithContext = false) => {
    const t = raw.trim();
    if (!t) return;

    const fullText = isFollowUp && noteContextRef.current
      ? `${noteContextRef.current}. (clarification from user: ${t})`
      : t;
    noteContextRef.current = fullText;

    setAiLoading(true);
    setAiError(null);
    setAiResult(null);
    confirmHandledRef.current = false;

    // Only send live state when the utterance references existing items.
    // Plain creates don't need it — saves ~1.5k tokens per request.
    const shouldSendContext = retryWithContext || needsLiveContext(fullText);

    try {
      const res = await fetch("/api/joshy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: fullText,
          ...(shouldSendContext ? { context: buildLiveContext() } : {}),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to parse");
      }

      const result: JoshyResult = await res.json();

      // Safety net: if Joshy returned an edit/delete/query/complete/resolve
      // but we didn't send context (classifier missed it), retry once with
      // context attached.
      const needsContextAction =
        result.action === "edit_task" ||
        result.action === "delete_task" ||
        result.action === "complete_task" ||
        result.action === "resolve_watch" ||
        result.action === "edit_medical" ||
        result.action === "delete_medical" ||
        result.action === "delete_watch" ||
        result.action === "edit_feed" ||
        result.action === "delete_feed" ||
        result.action === "query";
      if (!shouldSendContext && needsContextAction) {
        const retry = await fetch("/api/joshy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: fullText, context: buildLiveContext() }),
        });
        if (retry.ok) {
          setAiResult(await retry.json());
          return;
        }
      }

      setAiResult(result);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setAiLoading(false);
    }
  }, [buildLiveContext]);

  const handleAiSubmit = () => submitToJoshy(text);

  // ── Route a Joshy result to its real destination ──
  // Tasks → daily schedule. Everything else → parking lot triage queue.
  const commitJoshyResult = useCallback(
    (result: JoshyResult, originalText: string) => {
      const action = result.action;
      const body = result.data.text || originalText.trim();

      if (action === "task") {
        // Validate the category against the TaskCategory whitelist so a
        // hallucinated value doesn't leak into storage. Fall back to undefined
        // (addTask defaults to "routine") when invalid.
        const VALID_CATEGORIES = new Set([
          "routine",
          "feeding",
          "treatment",
          "special-needs",
          "hoof-dental",
          "weight",
          "sponsor",
          "projects",
          "admin",
          "care",
          "ranch",
        ]);
        const rawCat = result.data.category;
        const category =
          typeof rawCat === "string" && VALID_CATEGORIES.has(rawCat)
            ? (rawCat as import("@/lib/sanctuary-data").TaskCategory)
            : undefined;
        addTask({
          task: body,
          blockName: result.data.timeBlock ?? undefined,
          assignedTo: result.data.assignee ?? undefined,
          animalSpecific: result.data.animal ?? undefined,
          category,
        });
        return;
      }

      if (action === "edit_task") {
        const { blockIdx, taskIdx } = result.data;
        if (typeof blockIdx !== "number" || typeof taskIdx !== "number") return;
        editTask(blockIdx, taskIdx, {
          task: result.data.text || undefined,
          assignedTo: result.data.assignee ?? undefined,
          animalSpecific: result.data.animal ?? undefined,
          blockName: result.data.timeBlock ?? undefined,
        });
        return;
      }

      if (action === "delete_task") {
        const { blockIdx, taskIdx } = result.data;
        if (typeof blockIdx !== "number" || typeof taskIdx !== "number") return;
        deleteTask(blockIdx, taskIdx);
        return;
      }

      // Mark an existing task as done. toggleTask flips the current state, so
      // we only call it if the task is currently NOT done. buildLiveContext
      // filters out done tasks before sending to Joshy, so the target should
      // always be in the not-done state — but we re-check defensively.
      if (action === "complete_task") {
        const { blockIdx, taskIdx } = result.data;
        if (typeof blockIdx !== "number" || typeof taskIdx !== "number") return;
        const block = schedule[blockIdx];
        const task = block?.tasks?.[taskIdx];
        if (task && !task.done) {
          void toggleTask(blockIdx, taskIdx);
        }
        return;
      }

      // Resolve an existing watch item. Joshy returns entryIdx, which is the
      // index into the full (including resolved) parking-lot entries array
      // — matching what buildLiveContext sends.
      if (action === "resolve_watch") {
        const { entryIdx } = result.data;
        if (typeof entryIdx !== "number") return;
        const target = entries[entryIdx];
        if (target && !target.resolved) {
          void resolveEntry(target.id);
        }
        return;
      }

      // Medical entries go to the MedicalEntry table so they show up on the
      // medical dashboard, the deworming schedule, and the animal's record.
      // If Joshy didn't identify an animal we can't create a MedicalEntry
      // (animalId is required), so fall through to the parking lot so the
      // note isn't lost.
      if (action === "medical" && result.data.animal) {
        addMedicalEntry({
          animal: result.data.animal,
          type: inferMedicalType(body, result.data.title),
          title: result.data.title?.trim() || body,
          date: result.data.date ?? todayISO(),
          description: body,
          urgent: false,
          provider: result.data.provider ?? undefined,
        });
        return;
      }

      // Joshy-driven schedule changes for hoof/dental dates. These hit the
      // visit APIs in "set next-due" mode (animal + date, no visit record).
      if (action === "set_hoof_date" && result.data.animal && result.data.date) {
        void fetch("/api/hoof-visits", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            animal: result.data.animal,
            nextHoofDue: result.data.date,
          }),
        });
        return;
      }
      if (action === "set_dental_date" && result.data.animal && result.data.date) {
        void fetch("/api/dental-visits", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            animal: result.data.animal,
            nextDentalDue: result.data.date,
          }),
        });
        return;
      }

      // Log a completed hoof trim. POSTs one HoofVisit record per animal in
      // `animals` (if provided) or just the single `animal`. The nextDate
      // follow-up applies to each animal individually — if staff trimmed
      // multiple donkeys today and said "next in 6 weeks," each gets the
      // same next-due date.
      if (action === "log_hoof_visit") {
        const targets = resolveAnimalTargets(result.data, animals);
        if (targets.length === 0) return;
        for (const animalName of targets) {
          void fetch("/api/hoof-visits", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              animal: animalName,
              date: result.data.date ?? todayISO(),
              provider: result.data.provider ?? "",
              notes: result.data.notes ?? body,
              nextHoofDue: result.data.nextDate ?? undefined,
            }),
          });
        }
        return;
      }

      if (action === "log_dental_visit") {
        const targets = resolveAnimalTargets(result.data, animals);
        if (targets.length === 0) return;
        for (const animalName of targets) {
          void fetch("/api/dental-visits", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              animal: animalName,
              date: result.data.date ?? todayISO(),
              provider: result.data.provider ?? "",
              notes: result.data.notes ?? body,
              nextDentalDue: result.data.nextDate ?? undefined,
            }),
          });
        }
        return;
      }

      // Schedule the next vaccination. The Animal table doesn't have a
      // nextVaccinationDue column — instead we store a Vaccination
      // MedicalEntry with urgent=true on the given date, matching the
      // pattern used by the CSV-derived scheduledVaccinationEntries. That
      // way it flows into the "Upcoming" tab of the medical dashboard
      // automatically.
      if (action === "set_vaccination_date" && result.data.animal && result.data.date) {
        // Upsert semantics: if there's already a "Next Vaccination Due"
        // entry for this animal (created by a prior set_vaccination_date),
        // update its date in place so we don't accumulate stale records.
        const existing = medicalEntries.find(
          (m) =>
            m.animal === result.data.animal &&
            m.type === "Vaccination" &&
            m.title === "Next Vaccination Due"
        );
        if (existing) {
          void updateMedicalEntry(existing.id, { date: result.data.date });
        } else {
          void addMedicalEntry({
            animal: result.data.animal,
            type: "Vaccination",
            title: "Next Vaccination Due",
            date: result.data.date,
            description:
              "Vaccination booster scheduled via Joshy. Replace with actual vaccination record when administered.",
            urgent: true,
          });
        }
        return;
      }

      // Create or update a structured feed plan. Two modes:
      //   replace — use what Joshy returned; any block Joshy OMITTED (null)
      //             falls back to the existing plan, but any block Joshy
      //             explicitly returned (including empty []) overwrites.
      //   merge   — for each block Joshy returned, merge items into the
      //             existing block by item-name (same item → replace amount,
      //             new item → append). Blocks Joshy didn't return are
      //             untouched.
      // Either way we always POST the full 3-block plan to /api/feed since
      // the endpoint upserts the whole record.
      if (action === "set_feed_plan" && result.data.animal) {
        const mode = result.data.planMode ?? "merge";
        const animalName = result.data.animal;
        const incomingAm = result.data.amPlan ?? null;
        const incomingMid = result.data.midPlan ?? null;
        const incomingPm = result.data.pmPlan ?? null;
        const feedNotes = result.data.feedNotes ?? null;

        void (async () => {
          try {
            // Fetch the current feed schedules and find this animal's.
            let currentAm: { item: string; amount: string }[] = [];
            let currentMid: { item: string; amount: string }[] = [];
            let currentPm: { item: string; amount: string }[] = [];
            let currentNotes: string | null = null;
            const res = await fetch("/api/feed", { cache: "no-store" });
            if (res.ok) {
              const data = await res.json();
              const existing = (data?.entries ?? []).find(
                (e: { animal: string }) => e.animal === animalName
              );
              if (existing) {
                currentAm = existing.plan?.am ?? [];
                currentMid = existing.plan?.mid ?? [];
                currentPm = existing.plan?.pm ?? [];
                currentNotes = existing.notes ?? null;
              }
            }

            const mergeBlock = (
              current: { item: string; amount: string }[],
              incoming: { item: string; amount: string }[] | null
            ) => {
              if (!incoming) return current;
              const byName = new Map(current.map((x) => [x.item.toLowerCase(), x]));
              for (const add of incoming) {
                byName.set(add.item.toLowerCase(), add);
              }
              return Array.from(byName.values());
            };

            const am =
              mode === "replace"
                ? incomingAm ?? currentAm
                : mergeBlock(currentAm, incomingAm);
            const mid =
              mode === "replace"
                ? incomingMid ?? currentMid
                : mergeBlock(currentMid, incomingMid);
            const pm =
              mode === "replace"
                ? incomingPm ?? currentPm
                : mergeBlock(currentPm, incomingPm);

            await fetch("/api/feed", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                animal: animalName,
                plan: { am, mid, pm },
                notes: feedNotes ?? currentNotes,
              }),
            });
          } catch (err) {
            console.error("set_feed_plan dispatch failed:", err);
          }
        })();
        return;
      }

      // Update an editable field on an animal's profile. Strict whitelist on
      // the client so a hallucinated field name never reaches the API — and
      // enum checks on status/herd so bad values get dropped rather than
      // persisted. For array fields (traits/bestFriends/story/galleryImages)
      // we respect animalMode (add/remove/replace) and fetch the current
      // array via the in-memory animals data.
      if (action === "update_animal" && result.data.animal && result.data.animalField) {
        const field = result.data.animalField;
        const value = result.data.animalValue;
        const mode = result.data.animalMode ?? "replace";
        const animalName = result.data.animal;

        // Fields the client is allowed to forward. Must stay in sync with the
        // EDITABLE array in /api/animals/route.ts, but doubly-checked here so
        // a regression in either layer still blocks writes to identity fields.
        const STRING_FIELDS = new Set([
          "status",
          "herd",
          "pen",
          "tagline",
          "behavioralNotes",
          "profileImage",
          "adoptedFrom",
        ]);
        const ARRAY_FIELDS = new Set([
          "traits",
          "bestFriends",
          "story",
          "galleryImages",
        ]);
        const BOOL_FIELDS = new Set(["sponsorable"]);

        const isString = STRING_FIELDS.has(field);
        const isArray = ARRAY_FIELDS.has(field);
        const isBool = BOOL_FIELDS.has(field);

        if (!isString && !isArray && !isBool) {
          toastError(`Couldn't update ${animalName}: '${field}' isn't an editable field.`);
          return;
        }

        // Enum validation for the two fields with tight vocabularies.
        if (field === "status") {
          if (value !== "Active" && value !== "Special Needs") {
            toastError(
              `Couldn't update ${animalName}: status must be 'Active' or 'Special Needs', not '${value}'.`
            );
            return;
          }
        }
        // Case-insensitive normalization for herd: Joshy might return "angels"
        // or "elsie" — map to the canonical "Angels" / "Elsie's Herd" before
        // writing. We mutate `value` in place so the downstream isString
        // branch picks up the canonical form.
        let normalizedValue: typeof value = value;
        if (field === "herd") {
          if (typeof value !== "string") {
            toastError(`Couldn't move ${animalName}: herd value must be a string.`);
            return;
          }
          const HERD_CANON: Record<string, string> = {
            "elsie's herd": "Elsie's Herd",
            "elsies herd": "Elsie's Herd",
            "elsie": "Elsie's Herd",
            "brave": "Brave",
            "unicorns": "Unicorns",
            "pegasus": "Pegasus",
            "seniors": "Seniors",
            "senior": "Seniors",
            "pinky's herd": "Pinky's Herd",
            "pinkys herd": "Pinky's Herd",
            "pink": "Pinky's Herd",
            "pinky": "Pinky's Herd",
            "dragons": "Dragons",
            "angels": "Angels",
            "legacy": "Legacy",
          };
          const canonical = HERD_CANON[value.toLowerCase().trim()];
          if (!canonical) {
            toastError(`Couldn't move ${animalName}: '${value}' isn't a valid herd name.`);
            return;
          }
          normalizedValue = canonical;
        }

        const payload: Record<string, unknown> = { name: animalName };

        if (isString) {
          if (typeof normalizedValue !== "string") {
            toastError(`Couldn't update ${animalName}: '${field}' expects a string value.`);
            return;
          }
          payload[field] = normalizedValue;
        } else if (isBool) {
          if (typeof normalizedValue !== "boolean") {
            toastError(`Couldn't update ${animalName}: '${field}' expects true or false.`);
            return;
          }
          payload[field] = normalizedValue;
        } else if (isArray) {
          const incoming = Array.isArray(normalizedValue)
            ? normalizedValue.filter((v): v is string => typeof v === "string")
            : [];
          // Find the current array from the in-memory `animals` snapshot.
          const target = animals.find((a) => a.name === animalName);
          let current: string[] = [];
          if (target) {
            if (field === "traits") current = target.traits ?? [];
            else if (field === "bestFriends") current = target.bestFriends ?? [];
            else if (field === "story") current = target.story ?? [];
            else if (field === "galleryImages") current = target.galleryImages ?? [];
          }
          let next: string[];
          if (mode === "add") {
            next = Array.from(new Set([...current, ...incoming]));
          } else if (mode === "remove") {
            const drop = new Set(incoming.map((s) => s.toLowerCase()));
            next = current.filter((s) => !drop.has(s.toLowerCase()));
          } else {
            next = incoming;
          }
          payload[field] = next;
        }

        void fetch("/api/animals", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        return;
      }

      // ── Phase 4: edit/delete existing records ──

      // Edit a medical entry. Joshy identifies the target via medIdx (into
      // LIVE STATE's `medical` array); we map that back to the entry's id
      // and forward any changed fields.
      if (action === "edit_medical") {
        const { medIdx } = result.data;
        if (typeof medIdx !== "number") return;
        const sorted = [...medicalEntries].sort((a, b) =>
          b.date.localeCompare(a.date)
        );
        const target = sorted[medIdx];
        if (!target) return;
        const patch: Record<string, unknown> = {};
        if (result.data.title) patch.title = result.data.title;
        if (result.data.date) patch.date = result.data.date;
        if (result.data.text) patch.description = result.data.text;
        if (result.data.provider) patch.provider = result.data.provider;
        if (Object.keys(patch).length === 0) return;
        void updateMedicalEntry(target.id, patch);
        return;
      }

      if (action === "delete_medical") {
        const { medIdx } = result.data;
        if (typeof medIdx !== "number") return;
        const sorted = [...medicalEntries].sort((a, b) =>
          b.date.localeCompare(a.date)
        );
        const target = sorted[medIdx];
        if (!target) return;
        void removeMedicalEntry(target.id);
        return;
      }

      // Hard-delete a watch entry (distinct from resolve_watch which just
      // marks it resolved). Same entryIdx lookup as resolve_watch.
      if (action === "delete_watch") {
        const { entryIdx } = result.data;
        if (typeof entryIdx !== "number") return;
        const target = entries[entryIdx];
        if (!target || target.type !== "watch") return;
        void removeParkingLotEntry(target.id);
        return;
      }

      // Edit / delete a feed observation note (parking-lot entry type="feed").
      if (action === "edit_feed") {
        const { entryIdx } = result.data;
        if (typeof entryIdx !== "number") return;
        const target = entries[entryIdx];
        if (!target || target.type !== "feed") return;
        const patch: {
          text?: string;
          data?: typeof target.data;
        } = {};
        if (result.data.text) patch.text = result.data.text;
        // Preserve existing data while overlaying any animal change.
        if (result.data.animal) {
          patch.data = { ...target.data, animal: result.data.animal };
        }
        if (!patch.text && !patch.data) return;
        void updateParkingLotEntry(target.id, patch);
        return;
      }

      if (action === "delete_feed") {
        const { entryIdx } = result.data;
        if (typeof entryIdx !== "number") return;
        const target = entries[entryIdx];
        if (!target || target.type !== "feed") return;
        void removeParkingLotEntry(target.id);
        return;
      }

      // Delete a whole FeedSchedule row (the structured plan, not a note).
      // We DELETE by id via the /api/feed endpoint — first we fetch to find
      // the id for the animal.
      if (action === "delete_feed_plan" && result.data.animal) {
        const animalName = result.data.animal;
        void (async () => {
          try {
            const res = await fetch("/api/feed", { cache: "no-store" });
            if (!res.ok) return;
            const data = await res.json();
            const row = (data?.entries ?? []).find(
              (e: { animal: string; id: string }) => e.animal === animalName
            );
            if (!row) return;
            await fetch(`/api/feed?id=${encodeURIComponent(row.id)}`, {
              method: "DELETE",
            });
          } catch (err) {
            console.error("delete_feed_plan dispatch failed:", err);
          }
        })();
        return;
      }

      // Edit / delete a weight or BCS log. Joshy identifies the target via
      // animal + date. We fetch the weight logs for that animal, match by
      // date (most-recent first if multiple), and PATCH or DELETE.
      if (
        (action === "edit_weight_bcs" || action === "delete_weight_bcs") &&
        result.data.animal &&
        result.data.date
      ) {
        const animalName = result.data.animal;
        const targetDate = result.data.date;
        const isDelete = action === "delete_weight_bcs";
        const weight =
          typeof result.data.weight === "number" ? result.data.weight : null;
        const bcs = typeof result.data.bcs === "number" ? result.data.bcs : null;
        void (async () => {
          try {
            const res = await fetch(
              `/api/weight?animal=${encodeURIComponent(animalName)}`,
              { cache: "no-store" }
            );
            if (!res.ok) return;
            const data = await res.json();
            const rows = (data?.entries ?? []) as Array<{
              id: string;
              date: string;
            }>;
            // Take the most-recent log on the target date.
            const match = rows
              .filter((r) => r.date === targetDate)
              .sort((a, b) => b.date.localeCompare(a.date))[0];
            if (!match) {
              toastError(
                `No weight log found for ${animalName} on ${targetDate}.`
              );
              return;
            }
            if (isDelete) {
              const res = await fetch(
                `/api/weight?id=${encodeURIComponent(match.id)}`,
                { method: "DELETE" }
              );
              if (res.ok) toastSuccess(`Deleted ${animalName}'s weight log.`);
              else toastError(`Failed to delete ${animalName}'s weight log.`);
            } else {
              const patch: Record<string, unknown> = {};
              if (weight !== null) patch.weight = weight;
              if (bcs !== null) patch.bcs = bcs;
              if (result.data.text) patch.notes = result.data.text;
              if (Object.keys(patch).length === 0) return;
              const res = await fetch(`/api/weight`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: match.id, ...patch }),
              });
              if (res.ok) toastSuccess(`Updated ${animalName}'s weight log.`);
              else toastError(`Failed to update ${animalName}'s weight log.`);
            }
          } catch (err) {
            console.error(`${action} dispatch failed:`, err);
          }
        })();
        return;
      }

      // ── Phase 5: structured medical logs ──

      // Log a body temperature reading. Normal equine range is 99.0–101.5°F.
      // Outside that window, flag the entry as urgent so it shows on the
      // Overdue/Urgent tab. Title encodes the value so the medical list reads
      // like "Temperature: 101.2°F".
      if (action === "log_temperature") {
        const tempF =
          typeof result.data.tempF === "number" ? result.data.tempF : null;
        if (tempF === null) return;
        const targets = resolveAnimalTargets(result.data, animals);
        if (targets.length === 0) return;
        const isUrgent = tempF < 99 || tempF > 101.5;
        const classification =
          tempF < 99 ? "low" : tempF > 101.5 ? "elevated" : "normal";
        for (const animalName of targets) {
          void addMedicalEntry({
            animal: animalName,
            type: "Temperature",
            title: `Temperature: ${tempF}°F (${classification})`,
            date: result.data.date ?? todayISO(),
            description: result.data.notes ?? body,
            urgent: isUrgent,
            provider: result.data.provider ?? undefined,
          });
        }
        return;
      }

      // Log a fecal egg count result. Equine parasitology guideline:
      //   <200 epg = low shedder
      //   200–500 epg = moderate
      //   >500 epg = high shedder → urgent (needs dewormer now)
      if (action === "log_fecal_test") {
        const epg =
          typeof result.data.eggCount === "number" ? result.data.eggCount : null;
        if (epg === null) return;
        const targets = resolveAnimalTargets(result.data, animals);
        if (targets.length === 0) return;
        const band = epg < 200 ? "low" : epg <= 500 ? "moderate" : "high";
        const isUrgent = band === "high";
        const labPart = result.data.labName ? ` (${result.data.labName})` : "";
        for (const animalName of targets) {
          void addMedicalEntry({
            animal: animalName,
            type: "Fecal Test",
            title: `Fecal Egg Count: ${epg} epg (${band})${labPart}`,
            date: result.data.date ?? todayISO(),
            description: result.data.notes ?? body,
            urgent: isUrgent,
            provider: result.data.provider ?? undefined,
          });
        }
        return;
      }

      // Log a provider visit. A single visit may touch multiple animals
      // (e.g. "Dr. Moore came today, trimmed the whole Pegasus herd"). We
      // write one MedicalEntry per animal so each animal's record reflects
      // the visit. If only `animal` is set, treat it as a list of one.
      if (action === "log_provider_visit") {
        const list = resolveAnimalTargets(result.data, animals);
        if (list.length === 0) return;
        const title = result.data.title?.trim() || body;
        const date = result.data.date ?? todayISO();
        for (const animalName of list) {
          if (!animals.find((a) => a.name === animalName)) {
            toastError(`Skipped unknown animal '${animalName}' on the provider visit.`);
            continue;
          }
          void addMedicalEntry({
            animal: animalName,
            type: "Vet Visit",
            title,
            date,
            description: result.data.notes ?? body,
            urgent: false,
            provider: result.data.provider ?? undefined,
          });
        }
        return;
      }

      // ── Phase 6: admin (volunteers + knowledge base) ──

      // Add a volunteer. Email is required (it's the unique key). The POST
      // endpoint upserts, so re-adding the same email updates the record.
      if (action === "add_volunteer" && result.data.volunteerName && result.data.volunteerEmail) {
        void fetch("/api/volunteers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: result.data.volunteerName,
            email: result.data.volunteerEmail,
            phone: result.data.volunteerPhone ?? "",
            role: result.data.volunteerRole ?? "volunteer",
            status: result.data.volunteerStatus ?? "pending",
            availability: result.data.volunteerAvailability ?? [],
            skills: result.data.volunteerSkills ?? [],
            notes: result.data.volunteerNotes ?? "",
          }),
        });
        return;
      }

      // Update a volunteer. Identify by volunteerEmail (unique) and patch
      // any writable field that was provided.
      if (action === "update_volunteer" && result.data.volunteerEmail) {
        const targetEmail = result.data.volunteerEmail;
        const arrayMode = result.data.volunteerArrayMode ?? "replace";
        const wantsSkills = Array.isArray(result.data.volunteerSkills);
        const wantsAvail = Array.isArray(result.data.volunteerAvailability);
        const needsCurrent = arrayMode !== "replace" && (wantsSkills || wantsAvail);

        void (async () => {
          const patch: Record<string, unknown> = { email: targetEmail };
          if (result.data.volunteerName) patch.name = result.data.volunteerName;
          if (result.data.volunteerPhone) patch.phone = result.data.volunteerPhone;
          if (result.data.volunteerRole) patch.role = result.data.volunteerRole;
          if (result.data.volunteerStatus) patch.status = result.data.volunteerStatus;
          if (result.data.volunteerNotes) patch.notes = result.data.volunteerNotes;

          // For skills/availability: in replace mode (default) we forward
          // exactly what Joshy returned. In add/remove mode we have to fetch
          // the current values first and compute the resulting array.
          let currentSkills: string[] = [];
          let currentAvail: string[] = [];
          if (needsCurrent) {
            try {
              const res = await fetch("/api/volunteers", { cache: "no-store" });
              if (res.ok) {
                const data = await res.json();
                const target = (data?.volunteers ?? []).find(
                  (v: { email: string }) =>
                    v.email.toLowerCase() === targetEmail.toLowerCase()
                );
                if (target) {
                  currentSkills = target.skills ?? [];
                  currentAvail = target.availability ?? [];
                } else {
                  toastError(`No volunteer found with email ${targetEmail}.`);
                  return;
                }
              }
            } catch (err) {
              console.error("update_volunteer lookup failed:", err);
              toastError("Couldn't load the current volunteer record.");
              return;
            }
          }

          const mergeArray = (
            current: string[],
            incoming: string[],
            mode: "add" | "remove" | "replace"
          ): string[] => {
            if (mode === "add") return Array.from(new Set([...current, ...incoming]));
            if (mode === "remove") {
              const drop = new Set(incoming.map((s) => s.toLowerCase()));
              return current.filter((s) => !drop.has(s.toLowerCase()));
            }
            return incoming;
          };

          if (wantsSkills) {
            patch.skills = mergeArray(
              currentSkills,
              result.data.volunteerSkills as string[],
              arrayMode
            );
          }
          if (wantsAvail) {
            patch.availability = mergeArray(
              currentAvail,
              result.data.volunteerAvailability as string[],
              arrayMode
            );
          }

          if (Object.keys(patch).length <= 1) return; // only email, nothing to update
          const r = await fetch("/api/volunteers", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch),
          });
          if (r.ok) toastSuccess(`Updated volunteer ${targetEmail}.`);
          else toastError(`Failed to update volunteer ${targetEmail}.`);
        })();
        return;
      }

      // Hard-delete a volunteer by email.
      if (action === "delete_volunteer" && result.data.volunteerEmail) {
        const targetEmail = result.data.volunteerEmail;
        void (async () => {
          const r = await fetch(
            `/api/volunteers?email=${encodeURIComponent(targetEmail)}`,
            { method: "DELETE" }
          );
          if (r.ok) toastSuccess(`Removed volunteer ${targetEmail}.`);
          else toastError(`No volunteer found with email ${targetEmail}.`);
        })();
        return;
      }

      // Add a knowledge-base article. title + content are required.
      if (action === "add_article" && result.data.articleTitle && result.data.articleContent) {
        void fetch("/api/knowledge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: result.data.articleTitle,
            content: result.data.articleContent,
            tags: result.data.articleTags ?? [],
            linkedAnimals: result.data.articleLinkedAnimals ?? [],
          }),
        });
        return;
      }

      // Edit / delete a knowledge-base article. Identify by articleTitle —
      // dispatcher fetches articles and matches case-insensitively, then
      // forwards the cuid to the PATCH or DELETE endpoint.
      if (
        (action === "update_article" || action === "delete_article") &&
        result.data.articleTitle
      ) {
        const targetTitle = result.data.articleTitle;
        const isDelete = action === "delete_article";
        void (async () => {
          try {
            const res = await fetch("/api/knowledge", { cache: "no-store" });
            if (!res.ok) {
              toastError("Couldn't load knowledge articles to look up the target.");
              return;
            }
            const data = await res.json();
            const match = (data?.articles ?? []).find(
              (a: { id: string; title: string }) =>
                a.title.toLowerCase() === targetTitle.toLowerCase()
            );
            if (!match) {
              toastError(`No article titled '${targetTitle}' was found.`);
              return;
            }
            if (isDelete) {
              const r = await fetch(
                `/api/knowledge?id=${encodeURIComponent(match.id)}`,
                { method: "DELETE" }
              );
              if (r.ok) toastSuccess(`Deleted article '${match.title}'.`);
              else toastError(`Failed to delete article '${match.title}'.`);
            } else {
              const patch: Record<string, unknown> = { id: match.id };
              if (result.data.articleNewTitle) patch.title = result.data.articleNewTitle;
              if (result.data.articleContent) patch.content = result.data.articleContent;
              if (Array.isArray(result.data.articleTags)) patch.tags = result.data.articleTags;
              if (Array.isArray(result.data.articleLinkedAnimals))
                patch.linkedAnimals = result.data.articleLinkedAnimals;
              if (Object.keys(patch).length <= 1) return;
              const r = await fetch("/api/knowledge", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(patch),
              });
              if (r.ok) toastSuccess(`Updated article '${match.title}'.`);
              else toastError(`Failed to update article '${match.title}'.`);
            }
          } catch (err) {
            console.error(`${action} dispatch failed:`, err);
            toastError("Something went wrong while updating the article.");
          }
        })();
        return;
      }

      // Weight + BCS recording.
      if (action === "weight_bcs" && result.data.animal) {
        const weight = typeof result.data.weight === "number" ? result.data.weight : null;
        const bcs = typeof result.data.bcs === "number" ? result.data.bcs : null;
        if (weight === null && bcs === null) {
          // No usable data → fall through to parking lot as a note.
        } else {
          void fetch("/api/weight", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              animal: result.data.animal,
              date: result.data.date ?? todayISO(),
              weight,
              bcs,
              notes: body,
            }),
          });
          return;
        }
      }

      // Only four actions are expected to land in the parking lot:
      //   - watch (health concern alert)
      //   - medical without an animal (fall-through from the guarded case
      //     above; user gave a medical note but didn't name a donkey)
      //   - feed (eating-event observation — not a plan change)
      //   - note (generic)
      //
      // Every other action is handled by a dedicated dispatch case above. If
      // we reach here with a different action, it means the guarded case up
      // there failed its validation (missing animal, missing field, etc.)
      // — landing it in the parking lot silently would hide the failure
      // from the user, so we warn and bail instead.
      const FALL_THROUGH_ACTIONS = new Set(["watch", "medical", "feed", "note"]);
      if (!FALL_THROUGH_ACTIONS.has(action)) {
        console.warn(
          `Joshy action '${action}' reached fall-through — likely missing required data (animal/field/etc.). Skipping.`
        );
        toastError(
          `Couldn't apply '${action}' — Joshy didn't return all the info needed. Try rephrasing.`
        );
        return;
      }

      const entryType = action as EntryType;

      addEntry(entryType, body, {
        animal: result.data.animal ?? undefined,
        assignee: result.data.assignee ?? undefined,
        timeBlock: result.data.timeBlock ?? undefined,
        severity: (result.data.severity as "high" | "medium" | "low") ?? undefined,
        title: result.data.title ?? undefined,
        date: result.data.date ?? undefined,
      });
    },
    [addTask, addEntry, addMedicalEntry, editTask, deleteTask, toggleTask, resolveEntry, schedule, entries, updateMedicalEntry, removeMedicalEntry, medicalEntries, updateParkingLotEntry, removeParkingLotEntry, toastError, toastSuccess]
  );

  // Speak text aloud, then run a callback when speech ends.
  const speakThen = useCallback((spoken: string, after: () => void) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      after();
      return;
    }
    window.speechSynthesis.cancel();
    let called = false;
    const once = () => {
      if (called) return;
      called = true;
      after();
    };
    const u = new SpeechSynthesisUtterance(spoken);
    u.rate = 1.05;
    u.pitch = 1;
    u.onend = once;
    u.onerror = once;
    // Fallback: speechSynthesis events are unreliable across browsers.
    setTimeout(once, Math.max(2500, spoken.length * 75));
    window.speechSynthesis.speak(u);
  }, []);

  // Wrap startListening so tapping the mic also activates hands-free mode.
  const startVoice = useCallback(() => {
    setVoiceMode(true);
    startListening();
  }, [startListening]);

  // ── Auto-start when triggered by the wake-word flow ──
  // The modal is opened with autoVoice=true after "Hey Joshy" fires.
  // Two paths:
  //  1. initialText provided → wake listener already captured the note
  //     ("hey joshy pink's bandage needs changing") — skip dictation and
  //     submit straight to Joshy. The confirm phase still listens for yes/no.
  //  2. initialText empty → user said only the wake phrase, so open the
  //     dictation mic and let them speak the note.
  const autoVoiceTriggeredRef = useRef(false);
  useEffect(() => {
    if (!open) {
      autoVoiceTriggeredRef.current = false;
      return;
    }
    if (!autoVoice || autoVoiceTriggeredRef.current) return;
    if (!supported) return;
    autoVoiceTriggeredRef.current = true;
    setActiveTab("joshy");

    const tail = initialText.trim();
    if (tail) {
      // Path 1: tail captured — go straight to Joshy, then confirm by voice.
      setText(tail);
      setVoiceMode(true);
      const t = setTimeout(() => {
        submitToJoshy(tail);
      }, 100);
      return () => clearTimeout(t);
    }

    // Path 2: no tail — open mic for dictation. Small delay so the wake
    // recognizer fully releases the mic before this one grabs it.
    const t = setTimeout(() => {
      startVoice();
    }, 350);
    return () => clearTimeout(t);
  }, [open, autoVoice, initialText, supported, startVoice, submitToJoshy]);

  // ── Hands-free flow #1: when the mic stops in Joshy mode, route the
  //    captured transcript to the right place based on the current phase.
  useEffect(() => {
    const wasListening = prevListeningRef.current;
    prevListeningRef.current = isListening;
    if (!voiceMode || activeTab !== "joshy") return;
    if (!(wasListening && !isListening)) return;
    if (aiLoading) return;
    const captured = transcript.trim();
    if (!captured) return;

    // Clarify phase: Joshy asked a question, user just answered. Resubmit
    // to Joshy as a follow-up (the original note + this clarification).
    if (aiResult && aiResult.clarify) {
      setAiResult(null);
      submitToJoshy(captured, true);
      return;
    }

    // Confirm phase (no clarify) is handled by the yes/no effect below.
    if (aiResult) return;

    // Dictate phase: this is the original note.
    setText(captured);
    submitToJoshy(captured);
  }, [isListening, voiceMode, activeTab, aiResult, aiLoading, transcript, submitToJoshy]);

  // ── Hands-free flow #2: once Joshy returns a result, speak it aloud and
  //    decide what to do next based on the action type:
  //      - query    → speak the answer, then auto-close (read-only)
  //      - clarify  → speak the question, listen for an open answer
  //      - create   → speak the summary, listen for "yes"/"no"
  useEffect(() => {
    if (!voiceMode || !aiResult) return;
    confirmHandledRef.current = false;

    // Query: just answer, no confirmation needed.
    if (aiResult.action === "query") {
      const answer = aiResult.summary || aiResult.data?.text || "I don't have an answer for that.";
      speakThen(answer, () => {
        // Auto-close 1.5s after speech ends so the user can also read it.
        setTimeout(() => {
          setText("");
          setAiResult(null);
          setVoiceMode(false);
          noteContextRef.current = "";
          onClose();
        }, 1500);
      });
      return () => {
        if (typeof window !== "undefined" && window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      };
    }

    const actionWord =
      aiResult.action === "watch"
        ? "watch alert"
        : aiResult.action === "feed"
          ? "feed note"
          : aiResult.action === "medical"
            ? "medical entry"
            : aiResult.action === "edit_task"
              ? "edit"
              : aiResult.action === "delete_task"
                ? "delete"
                : aiResult.action === "complete_task"
                  ? "task completion"
                  : aiResult.action === "resolve_watch"
                    ? "watch resolution"
                    : aiResult.action === "log_hoof_visit"
                      ? "hoof trim record"
                      : aiResult.action === "log_dental_visit"
                        ? "dental visit record"
                        : aiResult.action === "set_vaccination_date"
                          ? "next vaccination date"
                          : aiResult.action === "set_feed_plan"
                            ? "feed plan update"
                            : aiResult.action === "update_animal"
                              ? "animal profile update"
                              : aiResult.action === "edit_medical"
                                ? "edit"
                                : aiResult.action === "delete_medical"
                                  ? "delete"
                                  : aiResult.action === "delete_watch"
                                    ? "delete"
                                    : aiResult.action === "edit_weight_bcs"
                                      ? "edit"
                                      : aiResult.action === "delete_weight_bcs"
                                        ? "delete"
                                        : aiResult.action === "edit_feed"
                                          ? "edit"
                                          : aiResult.action === "delete_feed"
                                            ? "delete"
                                            : aiResult.action === "delete_feed_plan"
                                              ? "delete"
                                              : aiResult.action === "log_temperature"
                                                ? "temperature reading"
                                                : aiResult.action === "log_fecal_test"
                                                  ? "fecal test result"
                                                  : aiResult.action === "log_provider_visit"
                                                    ? "provider visit"
                                                    : aiResult.action === "add_volunteer"
                                                      ? "volunteer"
                                                      : aiResult.action === "update_volunteer"
                                                        ? "volunteer update"
                                                        : aiResult.action === "delete_volunteer"
                                                          ? "delete"
                                                          : aiResult.action === "add_article"
                                                            ? "knowledge article"
                                                            : aiResult.action === "update_article"
                                                              ? "article update"
                                                              : aiResult.action === "delete_article"
                                                                ? "delete"
                                                                : aiResult.action;
    // All `delete_*` actions get the "Are you sure?" confirm phrasing since
    // they're hard-deletes and not recoverable.
    const isDeleteAction = aiResult.action.startsWith("delete_");
    const verb =
      aiResult.action === "edit_task" ||
      aiResult.action === "edit_medical" ||
      aiResult.action === "edit_weight_bcs" ||
      aiResult.action === "edit_feed" ||
      aiResult.action === "update_volunteer" ||
      aiResult.action === "update_article"
        ? "apply this"
        : isDeleteAction
          ? "go ahead and"
          : aiResult.action === "complete_task" ||
              aiResult.action === "resolve_watch"
            ? "go ahead and apply this"
            : "create this";
    const confirmQuestion = isDeleteAction
      ? `${aiResult.summary}. Are you sure you want to delete it? Say yes or no.`
      : `${aiResult.summary}. Should I ${verb} ${actionWord}? Say yes or no.`;
    const prompt = aiResult.clarify ? aiResult.clarify : confirmQuestion;
    speakThen(prompt, () => {
      if (!confirmHandledRef.current) startListening();
    });
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [aiResult, voiceMode, speakThen, startListening, onClose]);

  // ── Hands-free flow #3: while in confirm phase, watch the transcript for
  //    yes/no keywords and act on them. Skipped during clarify phase —
  //    that's handled by the mic-stop effect above.
  useEffect(() => {
    if (!voiceMode || !aiResult) return;
    if (aiResult.action === "query") return;
    if (aiResult.clarify) return;
    if (confirmHandledRef.current) return;
    if (!transcript) return;
    const t = transcript.toLowerCase();
    const yes = /\b(yes|yeah|yep|yup|sure|okay|ok|confirm|submit|do it|create it|go ahead|sounds good|correct)\b/.test(t);
    const no = /\b(no|nope|nah|cancel|edit|stop|wait|back|redo|try again)\b/.test(t);

    if (yes) {
      confirmHandledRef.current = true;
      stopListening();
      setTimeout(() => {
        const result = aiResult;
        if (!result) return;
        commitJoshyResult(result, text);
        setText("");
        setAiResult(null);
        setVoiceMode(false);
        onClose();
      }, 150);
    } else if (no) {
      confirmHandledRef.current = true;
      stopListening();
      setAiResult(null);
      setText("");
      setTimeout(() => startListening(), 400);
    }
  }, [transcript, voiceMode, aiResult, stopListening, startListening, commitJoshyResult, text, onClose]);

  // ── Confirm AI result ──
  const handleConfirmAi = () => {
    if (!aiResult) return;
    commitJoshyResult(aiResult, text);
    setText("");
    setAiResult(null);
    onClose();
  };

  // ── Manual submit (non-AI tabs) ──
  const handleManualSubmit = () => {
    if (!text.trim()) return;

    // Tasks land directly in the daily schedule, not the parking lot.
    if (activeTab === "task") {
      addTask({
        task: text.trim(),
        blockName: timeBlock,
        assignedTo: assignee || undefined,
        animalSpecific: animal || undefined,
      });
      setText("");
      setAnimal("");
      setAssignee("");
      onClose();
      return;
    }

    // Medical entries get their own table so the medical dashboard, deworming
    // schedule, and animal record all see them. Needs an animal (required by
    // the schema); if the user didn't pick one, fall through to parking lot.
    if (activeTab === "medical" && animal) {
      addMedicalEntry({
        animal,
        type: inferMedicalType(text, null),
        title: text.trim(),
        date: date || todayISO(),
        description: text.trim(),
        urgent: false,
      });
      setText("");
      setAnimal("");
      setAssignee("");
      onClose();
      return;
    }

    const data: Record<string, string> = {};
    if (animal) data.animal = animal;
    if (timeBlock) data.timeBlock = timeBlock;
    if (assignee) data.assignee = assignee;
    if (activeTab === "watch") data.severity = severity;
    if (date) data.date = date;

    addEntry(activeTab as EntryType, text.trim(), data);
    setText("");
    setAnimal("");
    setAssignee("");
    onClose();
  };

  if (!open) return null;

  const isJoshy = activeTab === "joshy";

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-sidebar px-5 py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-bold text-white text-lg flex items-center gap-2">
              {isJoshy && <Sparkles className="w-5 h-5 text-sand" />}
              {isJoshy ? "Hey Joshy..." : "Add Note"}
            </h2>
            <p className="text-cream/60 text-xs">
              {isJoshy
                ? "Tell me what happened — I'll figure out what to do with it"
                : "Fill in the details below"}
            </p>
          </div>
          <button onClick={onClose} className="text-cream/60 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selector */}
        <div className="flex overflow-x-auto border-b border-card-border shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setAiResult(null);
                  setAiError(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? "border-sidebar text-sidebar"
                    : "border-transparent text-warm-gray hover:text-charcoal"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Form body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">

          {/* ═══ JOSHY AI TAB ═══ */}
          {isJoshy && !aiResult && (
            <>
              <div className="relative">
                <textarea
                  autoFocus
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={"Tell Joshy what happened, or ask a question — e.g. \"What tasks are assigned to Edj?\" or \"Fernie's bandage needs changing\""}
                  rows={3}
                  className="w-full px-4 py-3 text-base border border-card-border rounded-xl text-charcoal placeholder:text-warm-gray/50 focus:outline-none focus:ring-2 focus:ring-sand/50 resize-none pr-12"
                />
                {supported && (
                  <button
                    onClick={isListening ? stopListening : startVoice}
                    className={`absolute right-3 bottom-3 p-2 rounded-full transition-colors ${
                      isListening
                        ? "bg-red-500 text-white animate-pulse"
                        : "bg-cream text-warm-gray hover:bg-sand/30 hover:text-charcoal"
                    }`}
                    title={isListening ? "Stop listening" : "Voice input (hands-free)"}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                )}
              </div>

              {isListening && (
                <p className="text-xs text-red-500 font-medium animate-pulse">
                  Listening... speak now, then pause when done
                </p>
              )}

              {voiceMode && !isListening && (
                <p className="text-[11px] text-sidebar font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  Hands-free mode on — Joshy will ask you to confirm
                </p>
              )}

              {aiError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                  {aiError}
                </div>
              )}

              <button
                onClick={handleAiSubmit}
                disabled={!text.trim() || aiLoading}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-sidebar text-white font-bold rounded-xl hover:bg-sidebar-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-base"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Joshy is thinking...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Ask Joshy
                  </>
                )}
              </button>
            </>
          )}

          {/* ═══ JOSHY AI RESULT ═══ */}
          {isJoshy && aiResult && (
            <>
              {/* What the user said */}
              <div className="p-3 bg-cream/50 rounded-lg border border-card-border">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-warm-gray/60 mb-1">You said</p>
                <p className="text-sm text-charcoal">{text}</p>
              </div>

              {/* Joshy's interpretation */}
              <div className="p-4 rounded-xl border-2 border-sidebar/20 bg-sidebar/5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-sidebar" />
                  <p className="text-sm font-bold text-sidebar">Joshy understood this as:</p>
                </div>

                {/* Action type badge */}
                {(() => {
                  const actionMeta = actionLabels[aiResult.action] || actionLabels.note;
                  const Icon = actionMeta.icon;
                  return (
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`w-4 h-4 ${actionMeta.color}`} />
                      <span className={`text-sm font-semibold ${actionMeta.color}`}>
                        {actionMeta.label}
                      </span>
                      <span className="text-[10px] text-warm-gray bg-cream px-1.5 py-0.5 rounded">
                        {Math.round(aiResult.confidence * 100)}% confident
                      </span>
                    </div>
                  );
                })()}

                {/* Summary (also serves as the spoken answer for queries) */}
                <p className="text-sm text-charcoal font-medium mb-3 whitespace-pre-line">{aiResult.summary}</p>

                {/* Parsed fields — hide for query results since they're not creating anything */}
                {aiResult.action !== "query" && (
                <div className="flex flex-wrap gap-1.5">
                  {aiResult.data.animal && (
                    <span className="text-[11px] font-medium text-sky-dark bg-sky/10 px-2 py-1 rounded-lg">
                      {aiResult.data.animal}
                    </span>
                  )}
                  {aiResult.data.timeBlock && (
                    <span className="text-[11px] font-medium text-warm-gray bg-cream px-2 py-1 rounded-lg">
                      {aiResult.data.timeBlock}
                    </span>
                  )}
                  {aiResult.data.assignee && (
                    <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                      → {aiResult.data.assignee}
                    </span>
                  )}
                  {aiResult.data.severity && (
                    <span className={`text-[11px] font-medium px-2 py-1 rounded-lg ${
                      aiResult.data.severity === "high"
                        ? "text-red-700 bg-red-100"
                        : aiResult.data.severity === "medium"
                          ? "text-amber-700 bg-amber-100"
                          : "text-emerald-700 bg-emerald-100"
                    }`}>
                      {aiResult.data.severity} severity
                    </span>
                  )}
                  {aiResult.data.date && (
                    <span className="text-[11px] font-medium text-warm-gray bg-cream px-2 py-1 rounded-lg">
                      {aiResult.data.date}
                    </span>
                  )}
                  {typeof aiResult.data.weight === "number" && (
                    <span className="text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">
                      {aiResult.data.weight} lbs
                    </span>
                  )}
                  {typeof aiResult.data.bcs === "number" && (
                    <span className="text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">
                      BCS {aiResult.data.bcs}
                    </span>
                  )}
                  {aiResult.data.provider && (
                    <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg">
                      {aiResult.data.provider}
                    </span>
                  )}
                </div>
                )}

                {/* Clarifying question */}
                {aiResult.clarify && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      <span className="font-semibold">Joshy asks: </span>
                      {aiResult.clarify}
                    </p>
                  </div>
                )}
              </div>

              {/* Voice-confirm indicator (hidden for queries — read-only) */}
              {voiceMode && aiResult.action !== "query" && (
                <div className={`flex items-center gap-2 p-3 rounded-lg border ${isListening ? "bg-red-50 border-red-200" : "bg-sidebar/5 border-sidebar/20"}`}>
                  {isListening ? (
                    <Mic className="w-4 h-4 text-red-500 animate-pulse shrink-0" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-sidebar shrink-0" />
                  )}
                  <p className="text-xs font-medium text-charcoal">
                    {isListening
                      ? "Listening — say \"yes\" to create it, or \"no\" to redo"
                      : "Joshy is asking you to confirm..."}
                  </p>
                </div>
              )}

              {/* Delete confirmation warning banner — shown for any delete_* action */}
              {aiResult.action.startsWith("delete_") && !aiResult.clarify && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-700 font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    This will permanently remove the record. Confirm to delete.
                  </p>
                </div>
              )}

              {/* Action buttons — Done for queries, Delete button for delete_*, Confirm for everything else */}
              {aiResult.action === "query" ? (
                <button
                  onClick={() => {
                    setText("");
                    setAiResult(null);
                    setVoiceMode(false);
                    noteContextRef.current = "";
                    onClose();
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 bg-sidebar text-white font-bold rounded-xl hover:bg-sidebar-light transition-colors text-sm"
                >
                  <Check className="w-4 h-4" />
                  Done
                </button>
              ) : aiResult.action.startsWith("delete_") ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleConfirmAi}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Yes, delete
                  </button>
                  <button
                    onClick={() => setAiResult(null)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white border border-card-border text-charcoal font-medium rounded-xl hover:bg-cream transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleConfirmAi}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors text-sm"
                  >
                    <Check className="w-4 h-4" />
                    Confirm
                  </button>
                  <button
                    onClick={() => setAiResult(null)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white border border-card-border text-charcoal font-medium rounded-xl hover:bg-cream transition-colors text-sm"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                </div>
              )}
            </>
          )}

          {/* ═══ MANUAL TABS (Task, Medical, Feed, Watch) ═══ */}
          {!isJoshy && (
            <>
              {/* Structured fields */}
              <div className="grid grid-cols-2 gap-3">
                {(activeTab === "medical" || activeTab === "watch" || activeTab === "feed") && (
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-warm-gray/60 mb-1 block">
                      Animal
                    </label>
                    <div className="relative">
                      <select
                        value={animal}
                        onChange={(e) => setAnimal(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm border border-card-border rounded-lg text-charcoal bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-sand/50"
                      >
                        <option value="">Select donkey...</option>
                        {sortedAnimals.map((a) => (
                          <option key={a.slug} value={a.name}>{a.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-warm-gray absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                )}

                {activeTab === "task" && (
                  <>
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-warm-gray/60 mb-1 block">
                        Time Block
                      </label>
                      <div className="flex gap-1.5">
                        {["AM", "Mid", "PM"].map((block) => (
                          <button
                            key={block}
                            onClick={() => setTimeBlock(block)}
                            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                              timeBlock === block
                                ? "bg-sky text-white"
                                : "bg-cream text-charcoal hover:bg-sand/30"
                            }`}
                          >
                            {block}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-warm-gray/60 mb-1 block">
                        Assign to
                      </label>
                      <input
                        type="text"
                        value={assignee}
                        onChange={(e) => setAssignee(e.target.value)}
                        placeholder="Name (optional)"
                        className="w-full px-3 py-2.5 text-sm border border-card-border rounded-lg text-charcoal placeholder:text-warm-gray/40 focus:outline-none focus:ring-2 focus:ring-sand/50"
                      />
                    </div>
                  </>
                )}

                {activeTab === "medical" && (
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-warm-gray/60 mb-1 block">
                      Date
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
                    />
                  </div>
                )}

                {activeTab === "watch" && (
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-warm-gray/60 mb-1 block">
                      Severity
                    </label>
                    <div className="flex gap-1.5">
                      {(["low", "medium", "high"] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setSeverity(s)}
                          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                            severity === s
                              ? s === "high"
                                ? "bg-red-500 text-white"
                                : s === "medium"
                                  ? "bg-amber-500 text-white"
                                  : "bg-emerald-500 text-white"
                              : "bg-cream text-charcoal hover:bg-sand/30"
                          }`}
                        >
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Text input */}
              <div className="relative">
                <textarea
                  autoFocus
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={
                    activeTab === "task"
                      ? "Describe the task..."
                      : activeTab === "medical"
                        ? "What happened? Symptoms, treatment, observations..."
                        : activeTab === "feed"
                          ? "Feed note or change..."
                          : "What should we watch for?"
                  }
                  rows={3}
                  className="w-full px-4 py-3 text-base border border-card-border rounded-xl text-charcoal placeholder:text-warm-gray/50 focus:outline-none focus:ring-2 focus:ring-sand/50 resize-none pr-12"
                />
                {supported && (
                  <button
                    onClick={isListening ? stopListening : startListening}
                    className={`absolute right-3 bottom-3 p-2 rounded-full transition-colors ${
                      isListening
                        ? "bg-red-500 text-white animate-pulse"
                        : "bg-cream text-warm-gray hover:bg-sand/30 hover:text-charcoal"
                    }`}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                )}
              </div>

              {isListening && (
                <p className="text-xs text-red-500 font-medium animate-pulse">
                  Listening... speak now
                </p>
              )}

              <button
                onClick={handleManualSubmit}
                disabled={!text.trim()}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-sky text-white font-bold rounded-xl hover:bg-sky-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-base"
              >
                <Send className="w-4 h-4" />
                Submit
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
