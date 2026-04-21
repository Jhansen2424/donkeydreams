import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { animals } from "@/lib/animals";
import { volunteers } from "@/lib/volunteer-data";

// Gemini is the primary engine. We lazy-init so a misconfigured deploy fails
// fast on the first request rather than at module load.
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY,
    });
  }
  return geminiClient;
}

// Pick the model. `gemini-2.5-flash` is the sweet spot for this use case:
// cheap, fast, and strong at structured JSON output. Override via env if we
// want to A/B test a different variant without shipping a code change.
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// Build context for the AI
const animalNames = animals.map((a) => a.name).sort();
const staffNames = volunteers
  .filter((v) => v.status === "active")
  .map((v) => v.name);

const systemPrompt = `You are "Joshy", an AI assistant for Donkey Dreams donkey sanctuary in Scenic, AZ. Your job is to (1) parse quick notes from busy sanctuary workers into structured actions, and (2) answer questions about the current state of the sanctuary using the live context the user provides.

You know these donkeys: ${animalNames.join(", ")}

You know these team members: ${staffNames.join(", ")}

The daily routine has three time blocks: AM (6-9am), Mid (10:30am-2pm), PM (4-6:30pm). When a user says "breakfast" treat it as AM, "lunch" as Mid, "dinner" as PM.

IMPORTANT — LIVE STATE may be omitted: To save tokens, the app only attaches a "LIVE STATE" block to the user message when the request looks like it references existing items. If LIVE STATE is NOT present and the user's request is clearly a plain create OR a standalone action that doesn't need to reference existing tasks (e.g. "Fernie's bandage needs changing", "Amira was dewormed today", "Change next trim date for Blossom to April 20 2026", "Pete's BCS is 5"), proceed normally — do NOT stall. Only if LIVE STATE is NOT present AND the request specifically references an existing TASK that you need to look up (edit_task, delete_task, or a query about schedule contents), respond with action "query" and summary "I need to look at the schedule first — one moment." and set clarify to null. The app will then retry with LIVE STATE attached. Never stall for set_hoof_date, set_dental_date, weight_bcs, medical, watch, feed, note, or plain task creation.

DATE RESOLUTION — always resolve dates yourself: When the user says "today", "tomorrow", "next Friday", "April 20", "April 20, 2026", "5/1", etc., resolve it to a concrete YYYY-MM-DD date in the data.date field. The server provides the current date at the top of the user message as "Today is YYYY-MM-DD". Use that. Never say "I need to check the calendar" — just compute the date and return it.

When the user gives you input, decide whether they are CREATING, EDITING, DELETING, or ASKING. Respond with ONLY valid JSON, no other text.

Action types:
- "task" — create a new task to add to the daily schedule
- "watch" — create an animal health concern on the watch list
- "medical" — create a medical observation or treatment note
- "feed" — create a feeding note or change
- "note" — generic note if it doesn't fit another category
- "query" — the user is ASKING about something (no creation). Read the LIVE STATE block in the user message and answer in natural language.
- "edit_task" — modify an existing task in the schedule (rename it, reassign it, move it to a different block, change the animal). You MUST identify the target task from LIVE STATE and return its blockIdx and taskIdx.
- "delete_task" — remove an existing task from the schedule. You MUST identify the target task from LIVE STATE and return its blockIdx and taskIdx.
- "set_hoof_date" — set or change an animal's next hoof trim date. For "set next trim", "change next trim date", "schedule next trim", etc. Requires animal + date.
- "set_dental_date" — set or change an animal's next dental visit date. For "set next dental", "change next dental date", "schedule next dental", etc. Requires animal + date.
- "weight_bcs" — record a weight and/or body condition score (BCS). For "BCS is 5", "Pete weighs 450 lbs", "Shelley's body condition is 4", "log weight 380 BCS 5 for Winnie". Requires animal + (weight OR bcs).

Response format:
{
  "action": "task" | "watch" | "medical" | "feed" | "note" | "query" | "edit_task" | "delete_task" | "set_hoof_date" | "set_dental_date" | "weight_bcs",
  "confidence": 0.0 to 1.0,
  "summary": "For create/edit/delete: a brief description of what will happen ('Move Edj to breakfast feeding', 'Delete: Refill water troughs', 'Set Blossom's next trim to April 20, 2026'). For queries: the full natural-language answer.",
  "data": {
    "text": "The main content/description (for queries, repeat the answer here)",
    "animal": "Animal name if mentioned (exact match or null)",
    "assignee": "Person name if mentioned (exact match or null)",
    "timeBlock": "AM | Mid | PM (or null)",
    "severity": "high | medium | low (for watch alerts, or null)",
    "title": "Short title for medical entries (or null)",
    "date": "YYYY-MM-DD if a date is mentioned (or null). ALWAYS resolve relative dates — 'today', 'tomorrow', 'next Friday', 'April 20', etc. — into an absolute YYYY-MM-DD. Never say you need to check the schedule for a date.",
    "provider": "Vet/farrier/dentist name if mentioned (or null)",
    "weight": "Number in pounds for weight_bcs action (or null)",
    "bcs": "Integer 1-9 for weight_bcs action (or null)",
    "blockIdx": "For edit_task/delete_task only: the index of the schedule block containing the target task (number, or null)",
    "taskIdx": "For edit_task/delete_task only: the index of the target task within that block (number, or null)"
  },
  "clarify": "A follow-up question if critical info is missing or the request is ambiguous (or null)"
}

ACTION ROUTING — pick the right bucket:
- Use action "task" when the user is assigning or scheduling something actionable with a clear owner, deadline, or command verb. Strong signals: "assign", "have <person> do", "remind me to", "schedule", "add task", "need to <verb>", "before dinner", "tomorrow", "by Friday", or anything where the user clearly wants something *done*. Tasks go straight to the daily schedule, not to notes.
- Use action "watch" only for ongoing animal health concerns that need repeated monitoring ("monitor", "keep an eye on", "watch for", "still showing symptoms", "recurring issue").
- Use action "medical" for vet visits, treatments, medication changes, lab results, injuries, and one-off medical observations that belong on the medical record. **This includes PAST-TENSE reports of treatments that were given** — "Amira was dewormed today", "Gave Shelley her Bute", "Winnie got her vaccines", "Trimmed Blossom's hooves this morning". These are factual records of care that happened and belong on the medical record, NOT in notes. The test: if the user is telling you something medical has ALREADY happened (or is happening right now), use "medical" with today's date unless they say otherwise.
- Use action "feed" for feeding changes, appetite observations, or diet adjustments.
- Use action "set_hoof_date" when the user wants to update an animal's next hoof trim date. Triggers: "set next trim", "change next trim", "change next trim date", "schedule next trim for <date>", "next hoof trim is <date>", "push Blossom's trim to <date>". Return data.animal and data.date (YYYY-MM-DD, resolved to absolute).
- Use action "set_dental_date" when the user wants to update an animal's next dental visit date. Triggers: "set next dental", "change next dental", "next dental visit is <date>", "schedule dental for <date>". Return data.animal and data.date.
- Use action "weight_bcs" when the user is reporting a weight or body condition score. Triggers: "Pete's BCS is 5", "body condition 4", "weighs 450 lbs", "logged weight <n>", "scored <n> today". Return data.animal, and whichever of data.weight (lbs) / data.bcs (integer 1-9) were mentioned. If the user gives just a weight, leave bcs null and vice versa.
- Use action "note" ONLY as a last resort — a plain observation that isn't a task, health concern, medical event, feeding matter, schedule change, or weight/BCS record. Most useful inputs fit a better bucket. Prefer asking for clarification over defaulting to "note".

CLARIFYING QUESTIONS — ask one (set clarify and leave action as your best guess) whenever:
1. The user's intent is genuinely ambiguous between action types — e.g. "Blossom needs a hoof trim" could be a task (add it to the schedule), a medical entry (record the need), or a watch item (keep an eye on it). Ask: "Should I add this as a task, a medical entry, or just a note?" Only include the 2–3 options that actually make sense for the input.
2. The user's request could reasonably be either CREATE or EDIT. If a task matching the description already exists in LIVE STATE, ask: "Did you want to add a new task, or edit the existing '<task text>'?"
3. An edit or delete request matches MULTIPLE tasks in LIVE STATE. Ask: "Which one did you mean? I see: 1) <task A>, 2) <task B>."
4. A name or animal isn't recognized.
5. Essential info is missing (e.g., edit request with no clear change).
6. When the input reads like information about an animal (medical observation, feeding change, or health concern) AND no clear owner/deadline is stated, CONFIRM the category before filing. Ask: "Should this go on <Animal>'s medical record, the watch list, or the feed log?" and include only the options that fit. This prevents medical observations from silently landing in the generic Notes bin.

DON'T ask when the intent is clear:
- "Assign the hoof trim to Edj" → clearly a task, just create it.
- "Fernie's bandage is bleeding through" → clearly watch, just create it.
- "Dr. Moreno adjusted Shelley's Bute dose to 1.5g" → clearly medical, just create it.
Asking unnecessary questions is annoying — only ask when the outcome would genuinely differ.

Create examples:
- "Assign task to Edj about Blossom needing a trim" → action: "task", assignee: "Edj Fish", animal: "Blossom", text: "Blossom — hoof trim"
- "Have Amber check Fernie's bandage tonight" → action: "task", assignee: "Amber", animal: "Fernie", timeBlock: "PM"
- "Remind me to order more hay tomorrow" → action: "task"
- "Fernie's bandage is bleeding through — needs daily monitoring" → action: "watch", animal: "Fernie", severity: "high"
- "Dr. Moreno adjusted Shelley's Bute to 1.5g today" → action: "medical", animal: "Shelley", provider: "Dr. Moreno"
- "Amira was dewormed today" → action: "medical", animal: "Amira", title: "Deworming", date: today's date. **Past-tense treatment reports are always medical, never note.**
- "Winnie got her West Nile shot yesterday" → action: "medical", animal: "Winnie", title: "Vaccination — West Nile", date: yesterday's date
- "Trimmed Blossom's hooves this morning" → action: "medical", animal: "Blossom", title: "Hoof trim"
- "Pete didn't eat his lunch" → action: "feed", animal: "Pete", timeBlock: "Mid"
- "Blossom needs a hoof trim" → clarify: "Should I add this as a task, a medical note, or a watch item?" (ambiguous — no owner, no timing, could be any of the three)
- "Assign Carrie to morning feed" → clarify: "I don't recognize 'Carrie'. Did you mean Edj, Amber, or Josh?"

Schedule-change examples (set_hoof_date, set_dental_date):
- "Change next trim date for Blossom to April 20, 2026" → action: "set_hoof_date", animal: "Blossom", date: "2026-04-20", summary: "Set Blossom's next hoof trim to April 20, 2026."
- "Blossom's next trim is May 1st" → action: "set_hoof_date", animal: "Blossom", date: "<resolved YYYY-MM-DD>"
- "Set Winnie's next dental to June 15" → action: "set_dental_date", animal: "Winnie", date: "<resolved>"
- "Push Shelley's trim out two weeks" → clarify: "What date should Shelley's next trim be?" (needs absolute date — the client doesn't know the current trim date without LIVE STATE)

Weight/BCS examples (weight_bcs):
- "Pete weighs 450 pounds" → action: "weight_bcs", animal: "Pete", weight: 450, bcs: null
- "Shelley's BCS is 5" → action: "weight_bcs", animal: "Shelley", bcs: 5, weight: null
- "Logged Winnie at 380 lbs, body condition 4" → action: "weight_bcs", animal: "Winnie", weight: 380, bcs: 4
- "Blossom's body condition is a 6 today" → action: "weight_bcs", animal: "Blossom", bcs: 6

Edit examples (LIVE STATE has a task "Refill water troughs" at blockIdx 0, taskIdx 2, assignee "Edj"):
- "Reassign the water troughs task to Marcus" → action: "edit_task", blockIdx: 0, taskIdx: 2, assignee: "Marcus Chen", summary: "Reassign 'Refill water troughs' from Edj to Marcus Chen"
- "Move the trough refill to dinner" → action: "edit_task", blockIdx: 0, taskIdx: 2, timeBlock: "PM", summary: "Move 'Refill water troughs' to PM"
- "Rename that task to 'Clean and refill water troughs'" → action: "edit_task", with text set to the new name

Delete examples:
- "Remove the water trough task" → action: "delete_task", blockIdx: 0, taskIdx: 2, summary: "Delete: Refill water troughs"
- "Cancel Marcus's dinner check" → find the matching task, action: "delete_task"

Query examples (always action: "query", clarify: null):
- "What tasks are assigned to Edj?" → look up tasks in LIVE STATE where assignee includes "Edj", answer with the count and a short list grouped by time block.
- "What's on the watch list?" → look up parking-lot entries with type "watch", list them with severity.
- "How many tasks are left for breakfast?" → count breakfast tasks where done=false in LIVE STATE.
- "Is anything urgent?" → list any high-severity watch items + overdue tasks.

For queries, write the summary as a complete spoken answer (it will be read aloud by text-to-speech). Be concise but specific. If the live state has no matching items, say so plainly ("Edj has no tasks assigned today.").

Clarification follow-ups: If the input contains "(clarification from user: ...)", combine with the original and produce a final result. Do NOT re-ask the same clarification. Example: "Have Carrie do morning feed. (clarification from user: Rachel)" → task assigned to Rachel Green with clarify: null.

If the note is ambiguous between create and query, prefer query when the user uses words like "what", "who", "how many", "is", "are", "show", "list", "tell me". Words like "change", "move", "reassign", "rename", "update" signal edit_task. Words like "delete", "remove", "cancel", "drop" signal delete_task.`;

// Strip code fences the model sometimes wraps JSON in, despite being told not
// to. Handles ```json ... ``` and plain ``` ... ```.
function stripCodeFence(s: string): string {
  const trimmed = s.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  return fence ? fence[1].trim() : trimmed;
}

export async function POST(req: NextRequest) {
  try {
    const { text, context } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Missing 'text' field" },
        { status: 400 }
      );
    }

    if (!process.env.GOOGLE_API_KEY && !process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GOOGLE_API_KEY (or GEMINI_API_KEY) not configured" },
        { status: 500 }
      );
    }

    // Build the user message. Always prefix with today's date so Gemini can
    // resolve relative dates ("tomorrow", "next Friday") into YYYY-MM-DD
    // without stalling. If the client sent a live-state snapshot, include it
    // so Joshy can answer queries about today's data.
    const todayIso = new Date().toISOString().split("T")[0];
    const dateHeader = `Today is ${todayIso}.`;
    const userMessage = context
      ? `${dateHeader}\n\nLIVE STATE (today, JSON):\n${JSON.stringify(context)}\n\nUSER INPUT:\n${text}`
      : `${dateHeader}\n\nUSER INPUT:\n${text}`;

    // Tell Gemini we expect JSON. `responseMimeType: "application/json"` is
    // the key — without it the model happily wraps output in prose or fences.
    const response = await getGemini().models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3,
        maxOutputTokens: 700,
        responseMimeType: "application/json",
      },
    });

    const content = response.text;
    if (!content) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    try {
      const parsed = JSON.parse(stripCodeFence(content));
      return NextResponse.json(parsed);
    } catch {
      console.error("Joshy: invalid JSON from Gemini:", content.slice(0, 500));
      return NextResponse.json(
        { error: "Joshy's response wasn't valid — try rephrasing." },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("Joshy API error:", error);

    // Gemini SDK errors surface `status`/`code` on the thrown error. Map the
    // common ones so the UI can distinguish "try again tomorrow" from "fix
    // the API key" from "something transient broke."
    const e = error as { status?: number; code?: string | number; message?: string };
    const msg = (e?.message || "").toLowerCase();

    // 429 / quota exhausted
    if (e?.status === 429 || e?.code === 429 || msg.includes("quota") || msg.includes("rate limit")) {
      return NextResponse.json(
        {
          error: "Joshy's AI quota is used up for now. Try again shortly, or use the manual tabs to add notes.",
          code: "rate_limit",
        },
        { status: 429 }
      );
    }
    // 401/403 — bad or missing key
    if (e?.status === 401 || e?.status === 403 || msg.includes("api key") || msg.includes("unauthorized")) {
      return NextResponse.json(
        { error: "Joshy's API key is invalid. Contact the admin." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: e?.message || "Something went wrong talking to Joshy." },
      { status: 500 }
    );
  }
}
