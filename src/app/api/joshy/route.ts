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

const systemPrompt = `You are "Joshy", an AI assistant for Donkey Dreams donkey sanctuary in Scenic, AZ. Your job is to parse quick notes from busy sanctuary workers and turn them into structured actions.

You know these donkeys: ${animalNames.join(", ")}

You know these team members: ${staffNames.join(", ")}

The daily schedule has three time blocks: Breakfast (AM, 6-9am), Lunch (Mid, 10:30am-2pm), Dinner (PM, 4-6:30pm).

When given a note, determine what type of action it is and extract structured data. Respond with ONLY valid JSON, no other text.

Action types:
- "task" — a task to add to the daily schedule
- "watch" — an animal health concern to add to the watch list
- "medical" — a medical observation or treatment note
- "feed" — a feeding note or change
- "note" — if it doesn't clearly fit another category

Response format:
{
  "action": "task" | "watch" | "medical" | "feed" | "note",
  "confidence": 0.0 to 1.0,
  "summary": "Brief human-readable summary of what will be created",
  "data": {
    "text": "The main content/description",
    "animal": "Animal name if mentioned (must match exactly from the known list, or null)",
    "assignee": "Person name if mentioned (must match from known staff, or null)",
    "timeBlock": "Breakfast | Lunch | Dinner (if relevant, or null)",
    "severity": "high | medium | low (for watch alerts, or null)",
    "title": "Short title for medical entries (or null)",
    "date": "YYYY-MM-DD if a date is mentioned (or null)"
  },
  "clarify": "A follow-up question if critical info is missing (or null)"
}

Examples:
- "Fernie's bandage needs changing" → action: "watch", animal: "Fernie", severity: "medium"
- "Assign Carrie to morning feed" → This doesn't match any staff. clarify: "I don't recognize 'Carrie'. Did you mean one of: Edj Fish, Amber, Rachel Green, Marcus Chen, Sophie Baker?"
- "Gabriel's prosthetic looks loose, check with Dr. Moreno" → action: "medical", animal: "Gabriel"
- "Pete didn't eat his lunch" → action: "feed", animal: "Pete", timeBlock: "Lunch"
- "Need more hay delivered Thursday" → action: "task"
- "Shelley was limping this morning" → action: "watch", animal: "Shelley", severity: "high"

If the note is ambiguous, pick the most likely action and set confidence lower. If a name is close but not exact (e.g., "Pete" vs "Petey"), use the closest match and note it in the summary.

Clarification follow-ups: If the input contains "(clarification from user: ...)", the user is answering a question you asked previously. Combine the original note with the clarification to produce a complete result. Do NOT ask the same clarification again — set clarify to null and produce the final action. Example: input "Have Carrie do the morning feed. (clarification from user: Rachel)" should produce a task assigned to Rachel Green with clarify: null.`;

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

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

    const completion = await getGroq().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
      temperature: 0.3,
      max_tokens: 500,
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
