// Sign-in / sign-out mood questionnaire — exact wording and button labels
// from Edj's 9/17 spec. Values are stored 1-5 left-to-right (expectations
// is a 4-option question, 1-4). Word labels only, no emoji, single tap,
// nothing skippable except the final free-text field.

export interface MoodQuestion {
  key: "feeling" | "energy" | "anxiety" | "connection" | "expectations";
  textIn?: string; // present when asked at sign-in
  textOut?: string; // present when asked at sign-out
  options: string[]; // left to right = 1..N
}

export const MOOD_QUESTIONS: MoodQuestion[] = [
  {
    key: "feeling",
    textIn: "How are you feeling right now?",
    textOut: "How are you feeling now?",
    options: ["Very Low", "Low", "Neutral", "Good", "Great"],
  },
  {
    key: "energy",
    textIn: "What's your energy level right now?",
    textOut: "What's your energy level now?",
    options: ["Very Low", "Low", "Neutral", "High", "Very High"],
  },
  {
    key: "anxiety",
    textIn: "What's your anxiety level right now?",
    textOut: "What's your anxiety level now?",
    options: ["Very Calm", "Calm", "Neutral", "Anxious", "Very Anxious"],
  },
  {
    key: "connection",
    textOut: "How connected did you feel with the donkeys today?",
    options: [
      "Didn't Really Connect",
      "A Little",
      "Somewhat",
      "Connected",
      "Felt Very Connected",
    ],
  },
  {
    key: "expectations",
    textOut: "Did today go the way you expected?",
    options: ["Yes", "Better Than Expected", "Different But Good", "Not Really"],
  },
];

export const SIGN_IN_QUESTIONS = MOOD_QUESTIONS.filter((q) => q.textIn);
export const SIGN_OUT_QUESTIONS = MOOD_QUESTIONS.filter((q) => q.textOut);

export const QUESTION_LABELS: Record<string, string> = {
  feeling: "Feeling",
  energy: "Energy",
  anxiety: "Anxiety",
  connection: "Connection",
  expectations: "Expectations",
};

// Document slots for the signable PDFs — upload the real files to these
// keys from the admin Visitors section; the kiosk renders them inline.
export const SIGN_DOC_SLOTS = [
  { key: "signdoc-nda-sponsors-volunteers", label: "NDA — Sponsors & Volunteers" },
  { key: "signdoc-nda-third-parties", label: "NDA — Third Parties" },
  { key: "signdoc-waiver", label: "Liability Waiver" },
] as const;

export function ndaSlotFor(visitorType: string): (typeof SIGN_DOC_SLOTS)[number] {
  return visitorType === "volunteer" ? SIGN_DOC_SLOTS[0] : SIGN_DOC_SLOTS[1];
}
