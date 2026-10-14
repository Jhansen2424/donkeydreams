/**
 * Film-homepage narration: ONE clip per on-screen line, read verbatim, so the
 * voice can never drift from the text. Writes public/audio/film/<id>.mp3,
 * trims leading/trailing silence, measures each clip's exact duration, and
 * generates src/components/home2/narration-timings.ts — the film derives
 * every scene length and text-arrival time from those durations.
 *
 * Resumable: existing clips are skipped (durations cached in durations.json).
 * Run: npx tsx scripts/generate-film-narration.ts   (add --force to redo all)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import { GoogleGenAI } from "@google/genai";

const ROOT = join(__dirname, "..");
const env = readFileSync(join(ROOT, ".env.local"), "utf-8");
const apiKey = env.match(/^GOOGLE_API_KEY="?([^"\r\n]+)"?/m)![1];
const ai = new GoogleGenAI({ apiKey });

const OUT = join(ROOT, "public", "audio", "film");
const DUR_JSON = join(OUT, "durations.json");
const TS_OUT = join(ROOT, "src", "components", "home2", "narration-timings.ts");
mkdirSync(OUT, { recursive: true });
const FORCE = process.argv.includes("--force");

// A touch brisker than a slow nature doc (client 10/13: "just a touch faster").
const STYLE =
  "Read this warmly, like the narrator of a gentle nature documentary. Natural, unhurried but slightly brisk pace — not slow. Sincere, never salesy:\n\n";

export const SEGMENTS: Array<[string, string]> = [
  ["cold1", "Somewhere in the Arizona desert..."],
  ["cold2", "...there's a place where wild burro families never have to say goodbye."],
  ["hero1", "Preserving the wild burro spirit."],
  ["hero2", "We give entire wild burro families a forever home — together, with room to roam, and the freedom to still be who they are."],
  ["wild", "Wild and free today."],
  ["alone", "Alone tomorrow."],
  ["fam1", "In the wild, a burro's life revolves around family — a mother close by, a sibling, a herd they've known for years, grazing together, moving together, watching out for one another. Freedom, for a burro, means family — and it's not just behavior. A burro's limbic system — the part of the brain that governs emotion, memory, and bonding — works the same way ours does. They don't just form those bonds; they feel them, the same way we feel love, and the same way we feel it when we lose someone we love. Those bonds are real, and they run deep."],
  ["fam2", "When they're removed from the wild, that changes in an instant. One moment they're part of a herd that's never been apart. The next, they're alone — family scattered, a new world that looks nothing like the one they knew. Too often, what comes next isn't a wild burro habitat at all. It's a pen. A corral. The same four fence lines, every day, for the rest of their lives — with no family left to stand beside. They don't just lose their freedom. They carry what they lost."],
  ["fam3", "That's the gap Donkey Dreams exists to close — a place where burros removed from the wild can live out their lives with family intact, in a wild burro habitat catering to who they are, on their own terms."],
  ["save1", "Saving them together,"],
  ["save2", "not one at a time."],
  ["prom1", "At Donkey Dreams, burros removed from the wild get back the life they once had. We believe that takes three things: keeping their families whole, because a burro without their herd isn't complete. A wild burro habitat, with room to roam the way they once did. And their sovereignty honored — their right to still be who they are, even in our care."],
  ["prom2", "Nearly one hundred donkeys and wild burros live at Donkey Dreams today. Most arrived as family; some arrived alone and found one here — either way, no one goes it alone. As long as burros are being removed from the wild, we'll keep finding room for as many families as we can."],
  ["pil1", "Families whole."],
  ["pil2", "Room to roam."],
  ["pil3", "Sovereignty honored."],
  ["roam", "Room to roam."],
  ["graze", "Graze. No rush to breakfast at base camp. Just hanging on the ridge with friends and family, picking up a few nibbles along the way."],
  ["run", "Run. Dinner, then out to run — rocky, steep ground where their bodies are designed to thrive."],
  ["nap", "Nap. Shade, family, and nowhere they have to be. Reunited pairs rest nose to tail — inseparable ever since."],
  ["trusthead", "Trust, not control."],
  ["trust1", "In the wild, a burro decides how to spend their day. Where to graze. When to rest. Who to stand beside. We don't take that away just because they need care. Sovereignty, to us, means they get a say — that their needs carry the same weight as ours, the sanctuary's, anyone's. They aren't something we manage. They're someone we listen to."],
  ["trust2", "When a donkey needs treatment — a sore hoof, medicine, a watchful eye on a healing wound — our caretakers go to them, wherever they are, instead of pulling them away from their family and freedom to make it easier on us. We don't run them in herds to get it done, and we don't chase them to make it quicker — many of them were already chased once, the day they left the wild, and we won't ask them to relive that just to make a checkup easier on us."],
  ["trust3", "To be clear: every donkey gets the care they need, fully. What's different is how we get there."],
  ["sov", "We call it sovereignty: their right to still be who they are — not managed, not overridden, but met as an equal — even while we're taking care of them."],
  ["stories", "Every burro, every family, has a story."],
  ["gabriel", "Gabriel. Found wild and alone at a few months old — injured, no mother in sight. He needed a family and a prosthetic leg. Today he has both — enough to run, to play, and to stand watch over the family that took him in."],
  ["jackjack", "Jack-Jack. When Jack-Jack's mother died suddenly, he was only seven months old. Grief like that can be its own kind of danger for a burro. His herd was what kept him going."],
  ["xander", "Xander. Pulled from the slaughter pipeline at a livestock auction. It took us a year to bring him home. Now he's the only known father in a herd that includes two of his own sons."],
  ["brave", "The Brave Herd. Some of the most terrified wild burros we'd ever met. We let them learn to trust us in their own time. Now three generations of that family live here together."],
  ["started", "How it started. We'd already set out to start a wild burro sanctuary — rooted in habitat, sovereignty, and keeping bonds intact. We gave ourselves five years. Then Pink and Eli came along, and five years became one."],
  ["savemore", "Save more families. We've seen what this way of life gives them — peace, calm, joy. More families deserve exactly that: land to roam, people who've earned their trust, the same care every family here already has."],
  ["vtitle", "Every burro removed from the wild deserves this."],
  ["vpen", "Somewhere right now, a burro is standing in a pen. Four fence lines, and nothing past them — no hillside, no herd, no one who knows their name."],
  ["vquiet", "Every day they stand there, a little more of the wild burro spirit goes quiet."],
  ["vdeserve", "We believe they deserve more than survival. They deserve this:"],
  ["vp1", "A family to belong to."],
  ["vp2", "Room to roam."],
  ["vp3", "Sovereignty honored."],
  ["notsomeday", "Not someday —"],
  ["buildit", "but as soon as we can build it."],
  ["impact", "Make an impact. Everything at Donkey Dreams exists because people were inspired to give them a home. Give, and you're part of it — for every family already home, and every one still waiting."],
];

const RATE_HZ = 24000;

/** Trim leading/trailing near-silence (16-bit mono PCM), keep ~60ms pad. */
function trimSilence(pcm: Buffer): Buffer {
  const n = Math.floor(pcm.length / 2);
  const thresh = 600;
  let first = 0;
  let last = n - 1;
  while (first < n && Math.abs(pcm.readInt16LE(first * 2)) < thresh) first++;
  while (last > first && Math.abs(pcm.readInt16LE(last * 2)) < thresh) last--;
  const pad = Math.round(RATE_HZ * 0.06);
  first = Math.max(0, first - pad);
  last = Math.min(n - 1, last + pad);
  return pcm.subarray(first * 2, (last + 1) * 2);
}

function wavFromPcm(pcm: Buffer): Buffer {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(RATE_HZ, 24);
  header.writeUInt32LE(RATE_HZ * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

const MODELS = ["gemini-2.5-flash-preview-tts", "gemini-2.5-pro-preview-tts"];

async function synth(text: string): Promise<Buffer> {
  let lastErr: unknown;
  for (const model of MODELS) {
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        const res = await ai.models.generateContent({
          model,
          contents: [{ role: "user", parts: [{ text: STYLE + text }] }],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Sulafat" } } },
          },
        });
        const data = res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!data) throw new Error("no audio in response");
        return Buffer.from(data, "base64");
      } catch (e) {
        lastErr = e;
        const msg = (e as Error).message;
        console.log(`  ${model} attempt ${attempt} failed: ${msg.slice(0, 90)}`);
        // rate limits need a real cool-off
        await new Promise((r) => setTimeout(r, /429|quota|rate/i.test(msg) ? 20000 : 3000));
      }
    }
  }
  throw lastErr;
}

async function main() {
  const durations: Record<string, number> =
    existsSync(DUR_JSON) && !FORCE ? JSON.parse(readFileSync(DUR_JSON, "utf-8")) : {};

  for (const [id, text] of SEGMENTS) {
    const mp3 = join(OUT, `${id}.mp3`);
    if (!FORCE && existsSync(mp3) && durations[id]) {
      console.log(`${id}: cached (${durations[id].toFixed(2)}s)`);
      continue;
    }
    console.log(`${id}: synthesizing…`);
    const pcm = trimSilence(await synth(text));
    const seconds = pcm.length / 2 / RATE_HZ;
    const wav = join(OUT, `${id}.wav`);
    writeFileSync(wav, wavFromPcm(pcm));
    execSync(`ffmpeg -y -loglevel error -i "${wav}" -codec:a libmp3lame -b:a 64k "${mp3}"`);
    unlinkSync(wav);
    durations[id] = Math.round(seconds * 1000) / 1000;
    writeFileSync(DUR_JSON, JSON.stringify(durations, null, 1));
    console.log(`  ${id}: ${seconds.toFixed(2)}s`);
    await new Promise((r) => setTimeout(r, 1500));
  }

  const missing = SEGMENTS.filter(([id]) => !durations[id]).map(([id]) => id);
  if (missing.length) {
    console.error("MISSING:", missing.join(", "));
    process.exit(1);
  }
  const body = SEGMENTS.map(([id]) => `  ${JSON.stringify(id)}: ${durations[id]},`).join("\n");
  writeFileSync(
    TS_OUT,
    `// GENERATED by scripts/generate-film-narration.ts — do not edit by hand.\n` +
      `// Exact length (seconds) of each narration clip in public/audio/film/.\n` +
      `// The film derives every scene duration and text-arrival time from these.\n\n` +
      `export const NARR: Record<string, number> = {\n${body}\n};\n`
  );
  const total = Object.values(durations).reduce((a, b) => a + b, 0);
  console.log(`\nDONE — ${SEGMENTS.length} clips, ${total.toFixed(1)}s of narration. Wrote ${TS_OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
