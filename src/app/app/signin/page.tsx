"use client";

// Sign-In kiosk (GFAS requirement). Runs on the sanctuary tablet (or any
// staff phone) inside the logged-in app. Flow:
//   Sign in  → pick your name (or "I'm new") → sign NDA + waiver if not on
//              file (drawn signature, stored with timestamps) → 3 mood
//              questions → done.
//   Sign out → pick your name from who's on site → 5 questions + optional
//              "did anything stand out" → done.
// Question wording and button labels are exactly Edj's 9/17 spec
// (src/lib/visit-questions.ts). Mood values store 1-5 left-to-right so
// sign-in/sign-out pairs can be compared per session.

import { useCallback, useEffect, useRef, useState } from "react";
import { LogIn, LogOut, Search, ArrowLeft, Check, Loader2, UserPlus } from "lucide-react";
import SignaturePad from "@/components/app/SignaturePad";
import {
  SIGN_IN_QUESTIONS,
  SIGN_OUT_QUESTIONS,
  ndaSlotFor,
  SIGN_DOC_SLOTS,
  type MoodQuestion,
} from "@/lib/visit-questions";

interface KioskVisitor {
  id: string;
  name: string;
  visitorType: string;
  ndaSigned: boolean;
  waiverSigned: boolean;
}
interface OnSite {
  sessionId: string;
  visitorId: string;
  signInAt: string;
}

type Step =
  | { kind: "home" }
  | { kind: "pick-in" }
  | { kind: "new-visitor" }
  | { kind: "docs"; visitor: KioskVisitor; doc: "nda" | "waiver" }
  | { kind: "mood-in"; visitor: KioskVisitor; qIdx: number; answers: { questionKey: string; value: number }[] }
  | { kind: "pick-out" }
  | { kind: "mood-out"; session: OnSite; name: string; qIdx: number; answers: { questionKey: string; value: number }[] }
  | { kind: "standout"; session: OnSite; name: string; answers: { questionKey: string; value: number }[] }
  | { kind: "done"; message: string };

export default function SignInKioskPage() {
  const [visitors, setVisitors] = useState<KioskVisitor[]>([]);
  const [onSite, setOnSite] = useState<OnSite[]>([]);
  const [step, setStep] = useState<Step>({ kind: "home" });
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Doc slot documents (id per slot key) for rendering the signable PDFs.
  const [docIds, setDocIds] = useState<Record<string, string | null>>({});

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/visits?view=state", { cache: "no-store" });
      if (!res.ok) return;
      const body = (await res.json()) as { visitors: KioskVisitor[]; onSite: OnSite[] };
      setVisitors(body.visitors);
      setOnSite(body.onSite);
    } catch {
      // Kiosk shows stale state; actions surface their own errors.
    }
  }, []);

  useEffect(() => {
    void reload();
    (async () => {
      const next: Record<string, string | null> = {};
      for (const slot of SIGN_DOC_SLOTS) {
        try {
          const res = await fetch(`/api/documents?linkedTo=${encodeURIComponent(slot.key)}`, { cache: "no-store" });
          const body = res.ok ? ((await res.json()) as { documents: { id: string }[] }) : { documents: [] };
          next[slot.key] = body.documents[0]?.id ?? null;
        } catch {
          next[slot.key] = null;
        }
      }
      setDocIds(next);
    })();
  }, [reload]);

  // Auto-return to the welcome screen after a completed flow.
  const doneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (step.kind !== "done") return;
    doneTimerRef.current = setTimeout(() => setStep({ kind: "home" }), 5000);
    return () => {
      if (doneTimerRef.current) clearTimeout(doneTimerRef.current);
    };
  }, [step]);

  // After picking (or creating) a visitor: route to docs if anything is
  // unsigned, else straight into the sign-in questionnaire.
  const startSignIn = (visitor: KioskVisitor) => {
    setError(null);
    if (!visitor.ndaSigned) setStep({ kind: "docs", visitor, doc: "nda" });
    else if (!visitor.waiverSigned) setStep({ kind: "docs", visitor, doc: "waiver" });
    else setStep({ kind: "mood-in", visitor, qIdx: 0, answers: [] });
  };

  const submitSignIn = async (visitor: KioskVisitor, answers: { questionKey: string; value: number }[]) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sign_in", visitorId: visitor.id, moods: answers }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Sign-in failed");
      await reload();
      setStep({ kind: "done", message: `You're signed in, ${visitor.name.split(" ")[0]}. Enjoy the donkeys!` });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed — try again.");
    } finally {
      setBusy(false);
    }
  };

  const submitSignOut = async (
    session: OnSite,
    name: string,
    answers: { questionKey: string; value: number }[],
    standoutNote: string
  ) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sign_out", sessionId: session.sessionId, moods: answers, standoutNote }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Sign-out failed");
      await reload();
      setStep({ kind: "done", message: `Thanks for coming, ${name.split(" ")[0]}. See you next time!` });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-out failed — try again.");
    } finally {
      setBusy(false);
    }
  };

  const back = () => {
    setError(null);
    setStep({ kind: "home" });
    setSearch("");
  };

  return (
    <div className="max-w-2xl mx-auto py-4">
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
      )}

      {step.kind === "home" && (
        <div className="text-center space-y-8 py-10">
          <div>
            <p className="text-5xl mb-3">🫏</p>
            <h1 className="text-3xl font-bold text-charcoal">Welcome to Donkey Dreams</h1>
            <p className="text-warm-gray mt-2">
              Please sign in when you arrive and out when you leave.
              {onSite.length > 0 && ` ${onSite.length} ${onSite.length === 1 ? "person is" : "people are"} here right now.`}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 max-w-lg mx-auto">
            <button
              onClick={() => setStep({ kind: "pick-in" })}
              className="flex flex-col items-center gap-3 p-8 bg-sidebar text-white rounded-2xl text-xl font-bold hover:bg-sidebar-light transition-colors active:scale-95"
            >
              <LogIn className="w-10 h-10" />
              Sign In
            </button>
            <button
              onClick={() => setStep({ kind: "pick-out" })}
              className="flex flex-col items-center gap-3 p-8 bg-white border-2 border-card-border text-charcoal rounded-2xl text-xl font-bold hover:bg-cream transition-colors active:scale-95"
            >
              <LogOut className="w-10 h-10" />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {step.kind === "pick-in" && (
        <div className="space-y-4">
          <KioskHeader title="Who are you?" onBack={back} />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-gray/50" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type your name…"
              className="w-full pl-10 pr-4 py-3 text-lg bg-white border border-card-border rounded-xl text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
            />
          </div>
          <button
            onClick={() => setStep({ kind: "new-visitor" })}
            className="w-full flex items-center justify-center gap-2 p-4 bg-sky text-white rounded-xl text-lg font-bold hover:bg-sky-dark transition-colors"
          >
            <UserPlus className="w-6 h-6" />
            I&apos;m new here
          </button>
          <div className="grid sm:grid-cols-2 gap-2">
            {visitors
              .filter((v) => !search || v.name.toLowerCase().includes(search.toLowerCase()))
              .filter((v) => !onSite.some((s) => s.visitorId === v.id))
              .map((v) => (
                <button
                  key={v.id}
                  onClick={() => startSignIn(v)}
                  className="p-4 bg-white border border-card-border rounded-xl text-left text-lg font-medium text-charcoal hover:bg-cream transition-colors"
                >
                  {v.name}
                  <span className="block text-xs text-warm-gray/70 capitalize">{v.visitorType}</span>
                </button>
              ))}
          </div>
        </div>
      )}

      {step.kind === "new-visitor" && (
        <NewVisitorForm
          onBack={back}
          busy={busy}
          onCreate={async (form) => {
            setBusy(true);
            setError(null);
            try {
              const res = await fetch("/api/visits", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "create_visitor", ...form }),
              });
              if (!res.ok) throw new Error((await res.json()).error || "Could not save");
              const body = (await res.json()) as { visitor: { id: string; name: string; visitorType: string } };
              const visitor: KioskVisitor = { ...body.visitor, ndaSigned: false, waiverSigned: false };
              setVisitors((prev) => [...prev, visitor].sort((a, b) => a.name.localeCompare(b.name)));
              startSignIn(visitor);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Could not save — try again.");
            } finally {
              setBusy(false);
            }
          }}
        />
      )}

      {step.kind === "docs" && (
        <DocSignStep
          step={step}
          docIds={docIds}
          busy={busy}
          onBack={back}
          onSigned={async (signature) => {
            setBusy(true);
            setError(null);
            const slot = step.doc === "nda" ? ndaSlotFor(step.visitor.visitorType) : SIGN_DOC_SLOTS[2];
            try {
              const res = await fetch("/api/visits", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: "sign_docs",
                  visitorId: step.visitor.id,
                  ...(step.doc === "nda"
                    ? {
                        ndaSignature: signature,
                        ndaVersion: slot.key === "signdoc-nda-sponsors-volunteers" ? "sponsors-volunteers" : "third-parties",
                      }
                    : { waiverSignature: signature }),
                }),
              });
              if (!res.ok) throw new Error((await res.json()).error || "Could not save signature");
              const updated: KioskVisitor = {
                ...step.visitor,
                ndaSigned: step.doc === "nda" ? true : step.visitor.ndaSigned,
                waiverSigned: step.doc === "waiver" ? true : step.visitor.waiverSigned,
              };
              setVisitors((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
              startSignIn(updated);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Could not save signature — try again.");
            } finally {
              setBusy(false);
            }
          }}
        />
      )}

      {step.kind === "mood-in" && (
        <MoodStep
          title={`Almost there, ${step.visitor.name.split(" ")[0]}`}
          question={SIGN_IN_QUESTIONS[step.qIdx]}
          phase="in"
          progress={`${step.qIdx + 1} of ${SIGN_IN_QUESTIONS.length}`}
          onBack={back}
          onAnswer={(value) => {
            const answers = [...step.answers, { questionKey: SIGN_IN_QUESTIONS[step.qIdx].key, value }];
            if (step.qIdx + 1 < SIGN_IN_QUESTIONS.length) {
              setStep({ ...step, qIdx: step.qIdx + 1, answers });
            } else {
              void submitSignIn(step.visitor, answers);
            }
          }}
        />
      )}

      {step.kind === "pick-out" && (
        <div className="space-y-4">
          <KioskHeader title="Who's leaving?" onBack={back} />
          {onSite.length === 0 && (
            <p className="text-center text-warm-gray py-8">Nobody is signed in right now.</p>
          )}
          <div className="grid sm:grid-cols-2 gap-2">
            {onSite.map((s) => {
              const v = visitors.find((x) => x.id === s.visitorId);
              if (!v) return null;
              return (
                <button
                  key={s.sessionId}
                  onClick={() => setStep({ kind: "mood-out", session: s, name: v.name, qIdx: 0, answers: [] })}
                  className="p-4 bg-white border border-card-border rounded-xl text-left text-lg font-medium text-charcoal hover:bg-cream transition-colors"
                >
                  {v.name}
                  <span className="block text-xs text-warm-gray/70">
                    here since{" "}
                    {new Date(s.signInAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step.kind === "mood-out" && (
        <MoodStep
          title={`Before you go, ${step.name.split(" ")[0]}`}
          question={SIGN_OUT_QUESTIONS[step.qIdx]}
          phase="out"
          progress={`${step.qIdx + 1} of ${SIGN_OUT_QUESTIONS.length}`}
          onBack={back}
          onAnswer={(value) => {
            const answers = [...step.answers, { questionKey: SIGN_OUT_QUESTIONS[step.qIdx].key, value }];
            if (step.qIdx + 1 < SIGN_OUT_QUESTIONS.length) {
              setStep({ ...step, qIdx: step.qIdx + 1, answers });
            } else {
              setStep({ kind: "standout", session: step.session, name: step.name, answers });
            }
          }}
        />
      )}

      {step.kind === "standout" && (
        <StandoutStep
          busy={busy}
          onSubmit={(text) => void submitSignOut(step.session, step.name, step.answers, text)}
        />
      )}

      {step.kind === "done" && (
        <div className="text-center py-16 space-y-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-charcoal">{step.message}</p>
          <button onClick={back} className="text-sm font-medium text-sidebar hover:underline">
            Back to the welcome screen
          </button>
        </div>
      )}
    </div>
  );
}

function KioskHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onBack}
        className="p-2 rounded-lg bg-white border border-card-border text-charcoal hover:bg-cream"
        aria-label="Back"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <h1 className="text-2xl font-bold text-charcoal">{title}</h1>
    </div>
  );
}

function NewVisitorForm({
  onBack,
  onCreate,
  busy,
}: {
  onBack: () => void;
  onCreate: (form: {
    name: string;
    phone: string;
    email: string;
    emergencyName: string;
    emergencyPhone: string;
    visitorType: string;
  }) => void;
  busy: boolean;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [visitorType, setVisitorType] = useState("visitor");

  const field =
    "w-full px-3 py-3 text-base border border-card-border rounded-xl text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50";

  return (
    <div className="space-y-4">
      <KioskHeader title="Welcome! Tell us about you" onBack={onBack} />
      <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name (required)" className={field} />
      <div className="grid sm:grid-cols-2 gap-3">
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className={field} />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={field} />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <input value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} placeholder="Emergency contact name" className={field} />
        <input value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} placeholder="Emergency contact phone" className={field} />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-1.5">I am a…</p>
        <div className="flex gap-2">
          {(
            [
              ["visitor", "Visitor / Guest"],
              ["volunteer", "Volunteer"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setVisitorType(value)}
              className={`flex-1 py-3 rounded-xl text-base font-semibold border transition-colors ${
                visitorType === value
                  ? "bg-sidebar text-white border-sidebar"
                  : "bg-white text-charcoal border-card-border hover:bg-cream"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={() =>
          onCreate({ name, phone, email, emergencyName, emergencyPhone, visitorType })
        }
        disabled={!name.trim() || busy}
        className="w-full flex items-center justify-center gap-2 p-4 bg-sidebar text-white rounded-xl text-lg font-bold hover:bg-sidebar-light disabled:opacity-40 transition-colors"
      >
        {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
        Continue
      </button>
    </div>
  );
}

function DocSignStep({
  step,
  docIds,
  busy,
  onBack,
  onSigned,
}: {
  step: { visitor: KioskVisitor; doc: "nda" | "waiver" };
  docIds: Record<string, string | null>;
  busy: boolean;
  onBack: () => void;
  onSigned: (signature: string) => void;
}) {
  const [signature, setSignature] = useState<string | null>(null);
  const slot = step.doc === "nda" ? ndaSlotFor(step.visitor.visitorType) : SIGN_DOC_SLOTS[2];
  const docId = docIds[slot.key];

  return (
    <div className="space-y-4">
      <KioskHeader title={slot.label} onBack={onBack} />
      <p className="text-sm text-warm-gray">
        {step.doc === "nda"
          ? "Please read the non-disclosure agreement below and sign at the bottom. This is a one-time signature kept on file."
          : "Please read the liability waiver below and sign at the bottom. This is a one-time signature kept on file."}
      </p>
      {docId ? (
        <iframe
          src={`/api/documents/${docId}`}
          title={slot.label}
          className="w-full h-[45vh] bg-white border border-card-border rounded-xl"
        />
      ) : (
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          The {slot.label} document hasn&apos;t been uploaded to the app yet — a staff member can
          show you the paper copy. Your signature below still counts and is stored with today&apos;s
          date. (Staff: upload the PDF from Admin → Visitors &amp; Sign-Ins.)
        </div>
      )}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-1.5">
          Your signature — by signing you agree to the {slot.label}
        </p>
        <SignaturePad onChange={setSignature} />
      </div>
      <button
        onClick={() => signature && onSigned(signature)}
        disabled={!signature || busy}
        className="w-full flex items-center justify-center gap-2 p-4 bg-sidebar text-white rounded-xl text-lg font-bold hover:bg-sidebar-light disabled:opacity-40 transition-colors"
      >
        {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
        Agree &amp; Sign
      </button>
    </div>
  );
}

function MoodStep({
  title,
  question,
  phase,
  progress,
  onBack,
  onAnswer,
}: {
  title: string;
  question: MoodQuestion;
  phase: "in" | "out";
  progress: string;
  onBack: () => void;
  onAnswer: (value: number) => void;
}) {
  const text = phase === "in" ? question.textIn : question.textOut;
  return (
    <div className="space-y-6">
      <KioskHeader title={title} onBack={onBack} />
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-2">
          Question {progress}
        </p>
        <h2 className="text-2xl font-bold text-charcoal">{text}</h2>
      </div>
      <div className="grid gap-2">
        {question.options.map((label, i) => (
          <button
            key={label}
            onClick={() => onAnswer(i + 1)}
            className="p-4 bg-white border border-card-border rounded-xl text-lg font-semibold text-charcoal hover:bg-sky/10 hover:border-sky transition-colors active:scale-[0.98]"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function StandoutStep({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (text: string) => void;
}) {
  const [text, setText] = useState("");
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-charcoal">Did anything stand out today?</h2>
        <p className="text-sm text-warm-gray mt-1">Optional — skip if nothing comes to mind.</p>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder="Tell us anything…"
        className="w-full px-4 py-3 text-base border border-card-border rounded-xl text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
      />
      <div className="flex gap-3">
        <button
          onClick={() => onSubmit("")}
          disabled={busy}
          className="flex-1 p-4 bg-white border border-card-border text-charcoal rounded-xl text-lg font-semibold hover:bg-cream disabled:opacity-40 transition-colors"
        >
          Skip
        </button>
        <button
          onClick={() => onSubmit(text)}
          disabled={busy}
          className="flex-1 flex items-center justify-center gap-2 p-4 bg-sidebar text-white rounded-xl text-lg font-bold hover:bg-sidebar-light disabled:opacity-40 transition-colors"
        >
          {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
          Done
        </button>
      </div>
    </div>
  );
}
