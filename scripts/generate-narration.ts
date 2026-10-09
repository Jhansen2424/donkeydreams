/**
 * Generate the homepage "Listen to the story" narration with Gemini TTS.
 * Writes public/audio/story/<id>.wav (and .mp3 when ffmpeg is available).
 * Run: npx tsx scripts/generate-narration.ts
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, unlinkSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import { GoogleGenAI } from "@google/genai";

const env = readFileSync(join(__dirname, "..", ".env.local"), "utf-8");
const apiKey = env.match(/^GOOGLE_API_KEY="?([^"\r\n]+)"?/m)![1];
const ai = new GoogleGenAI({ apiKey });

const OUT = join(__dirname, "..", "public", "audio", "story");
mkdirSync(OUT, { recursive: true });

// Delivery note prepended to every segment — warm, unhurried, nature-doc.
const STYLE =
  "Read this slowly and warmly, like the narrator of a gentle nature documentary. Quiet reverence, soft pace, natural pauses. Never salesy:\n\n";

const SEGMENTS: Array<{ id: string; text: string }> = [
  {
    id: "hero",
    text: "Somewhere in the Arizona desert, there's a place where wild burros never have to say goodbye to their families. We call it Donkey Dreams. This is their story.",
  },
  {
    id: "youarehere",
    text: "A full day of roaming, playing, napping — lived entirely on their own terms. They don't eat where we put them. They eat beside who they trust. And this is Dusk and Dawn, mother and daughter, named for the same light at opposite ends of the day. Here, they'll grow old together. Never separated.",
  },
  {
    id: "familycase",
    text: "In the wild, a burro's life revolves around family. A mother close by. A sibling. A herd they've known for years. And it's not just behavior — a burro feels those bonds the way we feel love. When they're removed from the wild, all of that can vanish in an instant. Too often, what comes next is a pen. Four fence lines, every day, for the rest of their lives. They don't just lose their freedom. They carry what they lost. That's the gap Donkey Dreams exists to close.",
  },
  {
    id: "promise",
    text: "Saving them together, not one at a time. Keeping families whole. A wild burro habitat, with room to roam. And their sovereignty honored — their right to still be who they are. Nearly one hundred donkeys and wild burros live here today. No one goes it alone.",
  },
  {
    id: "roam",
    text: "No rush to breakfast. Their own trails, their own loop, across rocky, steep ground where their bodies are designed to thrive. And in the shade of a tree, Nelly Belle and Moses — mother and son, separated once through adoption, reunited here. Inseparable ever since.",
  },
  {
    id: "trust",
    text: "In the wild, a burro decides how to spend their day. We don't take that away just because they need care. When a donkey needs treatment, our caretakers go to them, wherever they are. We call it sovereignty — their right to still be who they are, even while we're taking care of them.",
  },
  {
    id: "stories",
    text: "Gabriel, found wild and alone, who needed a family and a prosthetic leg — and today has both. Jack-Jack, whose herd carried him through grief. Xander, pulled from the slaughter pipeline, now a father standing beside his own sons. And the Brave Herd — three generations of one family, who learned to trust again. Every burro, every family, has a story.",
  },
  {
    id: "vision",
    text: "Somewhere right now, a burro is standing in a pen. Four fence lines, and nothing past them. No hillside. No herd. No one who knows their name. Every day they stand there, a little more of the wild burro spirit goes quiet. We believe they deserve more than survival. A family to belong to. Room to roam. Not someday — but as soon as we can build it. And you can be part of that.",
  },
];

// 24 kHz, 16-bit, mono PCM → WAV
function wavFromPcm(pcm: Buffer, sampleRate = 24000): Buffer {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

let ffmpeg = false;
try {
  execSync("ffmpeg -version", { stdio: "ignore" });
  ffmpeg = true;
} catch {}
console.log("ffmpeg available:", ffmpeg);

const MODELS = ["gemini-2.5-flash-preview-tts", "gemini-2.5-pro-preview-tts"];

async function synth(text: string): Promise<Buffer> {
  let lastErr: unknown;
  for (const model of MODELS) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await ai.models.generateContent({
          model,
          contents: [{ role: "user", parts: [{ text: STYLE + text }] }],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: "Sulafat" } },
            },
          },
        });
        const data = res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!data) throw new Error("no audio in response");
        return Buffer.from(data, "base64");
      } catch (e) {
        lastErr = e;
        console.log(`  ${model} attempt ${attempt} failed: ${(e as Error).message.slice(0, 90)}`);
        await new Promise((r) => setTimeout(r, 2500));
      }
    }
  }
  throw lastErr;
}

async function main() {
  for (const seg of SEGMENTS) {
    const wavPath = join(OUT, `${seg.id}.wav`);
    const mp3Path = join(OUT, `${seg.id}.mp3`);
    if (existsSync(mp3Path) || (!ffmpeg && existsSync(wavPath))) {
      console.log(`${seg.id}: exists, skipping`);
      continue;
    }
    console.log(`${seg.id}: synthesizing…`);
    const pcm = await synth(seg.text);
    writeFileSync(wavPath, wavFromPcm(pcm));
    if (ffmpeg) {
      execSync(`ffmpeg -y -i "${wavPath}" -codec:a libmp3lame -b:a 64k "${mp3Path}"`, { stdio: "ignore" });
      unlinkSync(wavPath);
      console.log(`  ${seg.id}.mp3: ${(statSync(mp3Path).size / 1024).toFixed(0)} KB`);
    } else {
      console.log(`  ${seg.id}.wav: ${(statSync(wavPath).size / 1024).toFixed(0)} KB`);
    }
  }
  console.log("done");
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
