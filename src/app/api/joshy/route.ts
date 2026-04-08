import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { animals } from "@/lib/animals";
import { volunteers } from "@/lib/volunteer-data";

let groqClient: Groq | null = null;
function getGroq(): Groq {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

// Build context for the AI
const animalNames = animals.map((a) => a.name).sort();
const staffNames = volunteers
  .filter((v) => v.status === "active")
  .map((v) => v.name);

const systemPrompt = `You are "Joshy", an AI assistant for Donkey Dreams donkey sanctuary in Scenic, AZ. Your job is to (1) parse quick notes from busy sanctuary workers into structured actions, and (2) answer questions about the current state of the sanctuary using the live context the user provides.

You know these donkeys: ${animalNames.join(", ")}

You know these team members: ${staffNames.join(", ")}

The daily schedule has three time blocks: Breakfast (AM, 6-9am), Lunch (Mid, 10:30am-2pm), Dinner (PM, 4-6:30pm).

When the user gives you input, decide whether they are CREATING something or ASKING a question. Respond with ONLY valid JSON, no other text.

Action types:
- "task" — create a task to add to the daily schedule
- "watch" — create an animal health concern on the watch list
- "medical" — create a medical observation or treatment note
- "feed" — create a feeding note or change
- "note" — generic note if it doesn't fit another category
- "query" — the user is ASKING about something (no creation). Read the LIVE STATE block in the user message and answer in natural language.

Response format:
{
  "action": "task" | "watch" | "medical" | "feed" | "note" | "query",
  "confidence": 0.0 to 1.0,
  "summary": "For create actions: a brief summary of what will be created. For queries: the full natural-language answer to the user's question.",
  "data": {
    "text": "The main content/description (for queries, repeat the answer here)",
    "animal": "Animal name if mentioned (exact match or null)",
    "assignee": "Person name if mentioned (exact match or null)",
    "timeBlock": "Breakfast | Lunch | Dinner (or null)",
    "severity": "high | medium | low (for watch alerts, or null)",
    "title": "Short title for medical entries (or null)",
    "date": "YYYY-MM-DD if a date is mentioned (or null)"
  },
  "clarify": "A follow-up question if critical info is missing (or null)"
}

Create examples:
- "Fernie's bandage needs changing" → action: "watch", animal: "Fernie", severity: "medium"
- "Assign Carrie to morning feed" → clarify: "I don't recognize 'Carrie'. Did you mean Rachel Green, Marcus Chen, or Sophie Baker?"
- "Gabriel's prosthetic looks loose, check with Dr. Moreno" → action: "medical", animal: "Gabriel"
- "Pete didn't eat his lunch" → action: "feed", animal: "Pete", timeBlock: "Lunch"
- "Need more hay delivered Thursday" → action: "task"

Query examples (always action: "query", clarify: null):
- "What tasks are assigned to Edj?" → look up tasks in LIVE STATE where assignee includes "Edj", answer with the count and a short list grouped by time block.
- "What's on the watch list?" → look up parking-lot entries with type "watch", list them with severity.
- "How many tasks are left for breakfast?" → count breakfast tasks where done=false in LIVE STATE.
- "Is anything urgent?" → list any high-severity watch items + overdue tasks.
- "Who's working today?" → list distinct assignees from today's schedule.
- "What does Marcus have to do?" → tasks where assignee includes "Marcus".

For queries, write the summary as a complete spoken answer (it will be read aloud by text-to-speech). Be concise but specific. If the live state has no matching items, say so plainly ("Edj has no tasks assigned today.").

Clarification follow-ups: If the input contains "(clarification from user: ...)", combine with the original and produce a final result. Do NOT re-ask the same clarification. Example: "Have Carrie do morning feed. (clarification from user: Rachel)" → task assigned to Rachel Green with clarify: null.

If the note is ambiguous between create and query, prefer query when the user uses words like "what", "who", "how many", "is", "are", "show", "list", "tell me".`;

export async function POST(req: NextRequest) {
  try {
    const { text, context } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Missing 'text' field" },
        { status: 400 }
      );
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Build the user message. If the client sent a live-state snapshot,
    // include it so Joshy can answer queries about today's data.
    const userMessage = context
      ? `LIVE STATE (today, JSON):\n${JSON.stringify(context)}\n\nUSER INPUT:\n${text}`
      : text;

    const completion = await getGroq().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 700,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(content);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Joshy API error:", error);
    return NextResponse.json(
      { error: "Failed to parse input" },
      { status: 500 }
    );
  }
}
