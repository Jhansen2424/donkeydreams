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
} from "lucide-react";
import { useParkingLot, type EntryType } from "@/lib/parking-lot-context";
import { useSchedule } from "@/lib/schedule-context";
import { animals } from "@/lib/animals";

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
};

function getCurrentTimeBlock(): string {
  const hour = new Date().getHours();
  if (hour < 10) return "Breakfast";
  if (hour < 16) return "Lunch";
  return "Dinner";
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
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
  const { addEntry } = useParkingLot();
  const { addTask } = useSchedule();
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

  // ── AI Submit ──
  // isFollowUp = true means `raw` is the user's spoken answer to a previous
  // clarifying question. We append it to the running conversation context
  // so Joshy gets both the original note and the clarification.
  const submitToJoshy = useCallback(async (raw: string, isFollowUp = false) => {
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

    try {
      const res = await fetch("/api/joshy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: fullText }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to parse");
      }

      const result: JoshyResult = await res.json();
      setAiResult(result);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setAiLoading(false);
    }
  }, []);

  const handleAiSubmit = () => submitToJoshy(text);

  // ── Route a Joshy result to its real destination ──
  // Tasks → daily schedule. Everything else → parking lot triage queue.
  const commitJoshyResult = useCallback(
    (result: JoshyResult, originalText: string) => {
      const action = result.action;
      const body = result.data.text || originalText.trim();

      if (action === "task") {
        addTask({
          task: body,
          blockName: result.data.timeBlock ?? undefined,
          assignedTo: result.data.assignee ?? undefined,
          animalSpecific: result.data.animal ?? undefined,
        });
        return;
      }

      const entryType = (["watch", "medical", "feed", "note"].includes(action)
        ? action
        : "note") as EntryType;

      addEntry(entryType, body, {
        animal: result.data.animal ?? undefined,
        assignee: result.data.assignee ?? undefined,
        timeBlock: result.data.timeBlock ?? undefined,
        severity: (result.data.severity as "high" | "medium" | "low") ?? undefined,
        title: result.data.title ?? undefined,
        date: result.data.date ?? undefined,
      });
    },
    [addTask, addEntry]
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
  //    re-open the mic. Two flavors:
  //      - clarify present → speak the question, listen for an open answer
  //      - no clarify      → speak the summary, listen for "yes"/"no"
  useEffect(() => {
    if (!voiceMode || !aiResult) return;
    confirmHandledRef.current = false;
    const actionWord =
      aiResult.action === "watch"
        ? "watch alert"
        : aiResult.action === "feed"
          ? "feed note"
          : aiResult.action === "medical"
            ? "medical entry"
            : aiResult.action;
    const prompt = aiResult.clarify
      ? aiResult.clarify
      : `${aiResult.summary}. Should I create this ${actionWord}? Say yes or no.`;
    speakThen(prompt, () => {
      if (!confirmHandledRef.current) startListening();
    });
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [aiResult, voiceMode, speakThen, startListening]);

  // ── Hands-free flow #3: while in confirm phase, watch the transcript for
  //    yes/no keywords and act on them. Skipped during clarify phase —
  //    that's handled by the mic-stop effect above.
  useEffect(() => {
    if (!voiceMode || !aiResult) return;
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
                  placeholder={"e.g. \"Fernie's bandage needs changing\" or \"Assign Rachel to morning feed\""}
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

                {/* Summary */}
                <p className="text-sm text-charcoal font-medium mb-3">{aiResult.summary}</p>

                {/* Parsed fields */}
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
                </div>

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

              {/* Voice-confirm indicator */}
              {voiceMode && (
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

              {/* Confirm / Edit / Try Again */}
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
                        {["Breakfast", "Lunch", "Dinner"].map((block) => (
                          <button
                            key={block}
                            onClick={() => setTimeBlock(block)}
                            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                              timeBlock === block
                                ? "bg-sky text-white"
                                : "bg-cream text-charcoal hover:bg-sand/30"
                            }`}
                          >
                            {block === "Breakfast" ? "AM" : block === "Lunch" ? "Mid" : "PM"}
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
