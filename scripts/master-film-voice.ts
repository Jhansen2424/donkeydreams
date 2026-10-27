/**
 * Film-homepage narration from Amber's own recordings (client 10/27), in
 * place of the generated AI voice. Each recording covers one or more film
 * lines; this script masters it, splits it into one clip per line at the
 * natural pauses, trims each clip, and writes public/audio/film/<id>.mp3 plus
 * the timings file the film derives every scene length from.
 *
 * Mastering (per recording): rumble cut below 80 Hz, a little less boxiness
 * (250 Hz), a little more presence (3.5 kHz) and air, gentle de-essing and
 * compression, then two-pass loudness normalization to -16 LUFS so every
 * line plays at the same level.
 *
 * Run:  npx tsx scripts/master-film-voice.ts "<folder with the .m4a files>"
 *       add --verify to transcribe every clip and compare it to its line.
 * The original recordings are copied to scripts/.voice-raw/ (gitignored).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from "fs";
import { join } from "path";
import { spawnSync } from "child_process";

const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "public", "audio", "film");
const RAW = join(ROOT, "scripts", ".voice-raw");
const DUR_JSON = join(OUT, "durations.json");
const TS_OUT = join(ROOT, "src", "components", "home2", "narration-timings.ts");
const RATE = 48000;

/** Each film line, exactly as Amber reads it (the film shows the same words). */
export const LINES: Record<string, string> = {
  cold1: "Somewhere in the Arizona desert...",
  cold2: "...there's a place where wild burro families never have to say goodbye.",
  hero1: "Preserving the wild burro spirit.",
  hero2: "We give entire wild burro families a forever home — together, with room to roam, and the freedom to still be who they are.",
  wild: "Wild and free today.",
  alone: "Alone tomorrow.",
  fam1: "In the wild, a burro's life revolves around family — a mother close by, a sibling, a herd they've known for years, grazing together, moving together, watching out for one another. Freedom, for a burro, means family. It's not just behavior. A burro's limbic system — the part of the brain that governs emotion, memory, and bonding — works the same way ours does. They don't just form those bonds; they feel them, the same way we feel love, the same way we feel it when we lose someone we love. The bonds are real, and they run deep.",
  fam2: "When they're removed from the wild, that changes in an instant. One moment they're part of a herd that's never been apart. The next, they're alone — family scattered, a world that looks nothing like the one they knew. Too often, what comes next isn't a wild burro habitat at all. It's a pen. A corral. The same four fence lines, every day, for the rest of their lives — with no family left to stand beside. They don't just lose their freedom. They carry what they lost.",
  fam3: "That's the gap that Donkey Dreams exists to close — a place where burros removed from the wild can live out their lives with family intact, in a wild burro habitat catering to who they are, on their own terms.",
  save1: "Saving them together,",
  save2: "not one at a time.",
  prom1: "At Donkey Dreams, burros removed from the wild get back the life they once had. We believe that it takes three things: keeping their families whole, because a burro without their herd isn't complete. A wild burro habitat, with room to roam the way they once did. And their sovereignty honored — the right to still be who they are, even in our care.",
  prom2: "Nearly one hundred donkeys and wild burros live at Donkey Dreams today. Most arrived as a family; some arrived alone and found one here — either way, no one goes it alone. As long as burros are being removed from the wild, we'll keep finding room for as many families as we can.",
  pil1: "Families whole.",
  pil2: "Room to roam.",
  pil3: "Sovereignty honored.",
  roam: "Room to roam.",
  graze: "Graze. No rush to breakfast at base camp. Just hanging on the ridge with friends and family, picking up a few nibbles along the way.",
  run: "Run. Dinner, and then out to run — rocky, steep ground where their bodies are designed to thrive.",
  nap: "Nap. Shade, family, and nowhere they have to be. Reunited pairs rest nose to tail — inseparable ever since.",
  trusthead: "Trust, not control.",
  trust1: "In the wild, a burro decides how to spend their day. Where to graze. Where to rest. Who to stand beside. We don't take that away just because they need care. Sovereignty, to us, means that they get a say — that their needs carry the same weight as ours, the sanctuary's, anyone's. They aren't something we manage. They're someone we listen to.",
  trust2: "When a donkey needs treatment — a sore hoof, medicine, a watchful eye on a healing wound — our caretakers go to them, wherever they are, instead of pulling them away from their family and freedom to make it easier on us. We don't run them in herds to get it done, and we don't chase them to make it quicker — many of them were already chased once, the day that they were removed from the wild, and we won't ask them to relive that just to make a checkup easier on us.",
  trust3: "To be clear: every donkey gets the care they need, fully. What's different is how we get there.",
  sov: "We call it sovereignty: their right to still be who they are — not managed, not overridden, but met as an equal — even while they're in our care.",
  stories: "Every burro, every family, has a story.",
  gabriel: "Gabriel. Found wild and alone at a few months old — injured, no mother in sight. He needed a family and a prosthetic leg. Today he has both — enough to run, to play, to stand and watch over the family that took him in.",
  jackjack: "Jack-Jack. When Jack-Jack's mother died suddenly, he was only seven months old. Grief like that can be its own kind of danger for a burro. His herd was what kept him going.",
  xander: "Xander. Pulled from the slaughter pipeline at a livestock auction. It took us a year to bring him home. Now he's the only known father in a herd that includes two of his sons.",
  brave: "The Brave Herd. Some of the most terrified wild burros we'd ever met. We let them learn to trust us in their own time. Now three generations of that family live here together.",
  started: "How it started. We had already set out to start a wild burro sanctuary — rooted in habitat, sovereignty, and keeping bonds intact. We gave ourselves five years, and then Pink and Eli came along, and five years became one.",
  savemore: "Save more families. We've seen what this way of life gives them — peace, calm, joy. More families deserve exactly that: land to roam, people who've earned their trust, the same care every family here already has.",
  vtitle: "Every burro removed from the wild deserves this.",
  vpen: "Somewhere right now, a burro is standing in a pen. Four fence lines, nothing past them — no hillsides, no herd, no one who knows their name.",
  vquiet: "Every day they stand there, a little more of the wild burro spirit goes quiet.",
  vdeserve: "We believe they deserve more than survival. They deserve this:",
  vp1: "A family to belong to.",
  vp2: "Room to roam.",
  vp3: "Sovereignty honored.",
  notsomeday: "Not someday —",
  buildit: "but as soon as we can build it.",
  impact: "Make an impact. Everything at Donkey Dreams exists because people were inspired to give them a home. Give, and you're part of it — for every family already home, and every one still waiting.",
};

/** Recording file (without .m4a) → the film lines it holds, in order. */
const RECORDINGS: Array<[string, string[]]> = [
  ["Somewhere", ["cold1", "cold2"]],
  ["Preserving the wild burro sprit", ["hero1", "hero2"]],
  ["Wild and free", ["wild", "alone"]],
  ["In the wild", ["fam1"]],
  ["When they are removed from the wild", ["fam2"]],
  ["That’s the gap", ["fam3"]],
  ["Saving them together", ["save1", "save2"]],
  ["At donkey dreams burros removed", ["prom1"]],
  ["Nearly 100 donkeys", ["prom2", "pil1", "pil2", "pil3"]],
  ["Room to roam", ["roam"]],
  ["Graze", ["graze"]],
  ["Run", ["run"]],
  ["Nap", ["nap"]],
  ["Trust not control", ["trusthead", "trust1"]],
  ["When a donkey needs treatment", ["trust2"]],
  ["To be clear", ["trust3"]],
  ["Sovereignty", ["sov"]],
  ["Every burro", ["stories"]],
  ["Gabriel", ["gabriel"]],
  ["Jack", ["jackjack"]],
  ["Xander", ["xander"]],
  ["The brave herd", ["brave"]],
  ["How it started", ["started"]],
  ["Save more families", ["savemore"]],
  ["Every burro removed", ["vtitle"]],
  ["Somewhere right now", ["vpen"]],
  ["Everyday they stand", ["vquiet"]],
  ["We believe", ["vdeserve", "vp1", "vp2", "vp3"]],
  ["Not someday", ["notsomeday", "buildit"]],
  ["Make an impact", ["impact"]],
];

/** Stumbles cut from the original recording before mastering: [start, end]
 *  seconds. Each was placed from the loudness contour and spectrogram, then
 *  checked by transcribing the edited audio (clean, nothing clipped). */
const CUTS: Record<string, Array<[number, number]>> = {
  // "at a few few months old" -> "at a few months old"
  Gabriel: [[3.57, 3.9]],
  // "when we lose a someone we love" -> "lose someone we love"
  "In the wild": [[31.84, 31.9]],
  // "and sovereignty honored" -> "Sovereignty honored." (the pillar on screen)
  "We believe": [[9.55, 9.83]],
};

const MASTER =
  "highpass=f=80," +
  "equalizer=f=250:t=q:w=1.0:g=-2," +
  "equalizer=f=3500:t=q:w=1.2:g=2," +
  "highshelf=f=9000:g=1.5," +
  "deesser=i=0.35," +
  "acompressor=threshold=-21dB:ratio=3:attack=8:release=140:makeup=2";

/** A recording as 48 kHz mono 16-bit PCM, untouched. */
function decode(src: string): Buffer {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", src, "-ar", String(RATE), "-ac", "1", "-f", "s16le", "-"], {
    maxBuffer: 1 << 28,
  });
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${r.stderr.toString().slice(-500)}`);
  return r.stdout as Buffer;
}

const PCM_IN = ["-f", "s16le", "-ar", String(RATE), "-ac", "1", "-i", "-"];

/** Master PCM to -16 LUFS (two-pass loudness normalization). */
function masterPcm(input: Buffer): Buffer {
  const probe = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-nostats", ...PCM_IN, "-af", `${MASTER},loudnorm=I=-16:TP=-1.5:LRA=9:print_format=json`, "-f", "null", "-"],
    { input, maxBuffer: 1 << 28 }
  );
  if (probe.status !== 0) throw new Error(`ffmpeg failed: ${probe.stderr.toString().slice(-500)}`);
  const report = probe.stderr.toString();
  const json = JSON.parse(report.slice(report.lastIndexOf("{"), report.lastIndexOf("}") + 1));
  const ln =
    `loudnorm=I=-16:TP=-1.5:LRA=9:measured_I=${json.input_i}:measured_TP=${json.input_tp}` +
    `:measured_LRA=${json.input_lra}:measured_thresh=${json.input_thresh}:offset=${json.target_offset}:linear=true`;
  const r = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-loglevel", "error", ...PCM_IN, "-af", `${MASTER},${ln}`, "-ar", String(RATE), "-ac", "1", "-f", "s16le", "-"],
    { input, maxBuffer: 1 << 28 }
  );
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${r.stderr.toString().slice(-500)}`);
  return r.stdout as Buffer;
}

const samples = (pcm: Buffer) => Math.floor(pcm.length / 2);
const WIN = Math.round(RATE * 0.01);

/** Per-10ms loudness (dBFS). */
function levels(pcm: Buffer): number[] {
  const n = samples(pcm);
  const out: number[] = [];
  for (let w = 0; w * WIN < n; w++) {
    let sum = 0;
    const end = Math.min(n, (w + 1) * WIN);
    for (let i = w * WIN; i < end; i++) sum += pcm.readInt16LE(i * 2) ** 2;
    const rms = Math.sqrt(sum / Math.max(1, end - w * WIN)) / 32768;
    out.push(rms > 0 ? 20 * Math.log10(rms) : -120);
  }
  return out;
}

/** Pauses between words: runs of quiet 10ms windows, as [startWin, endWin). */
function pauses(lv: number[], minMs = 140, thresh = -46): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  let s = -1;
  for (let w = 0; w <= lv.length; w++) {
    const quiet = w < lv.length && lv[w] < thresh;
    if (quiet && s < 0) s = w;
    if (!quiet && s >= 0) {
      if ((w - s) * 10 >= minMs) out.push([s, w]);
      s = -1;
    }
  }
  return out;
}

const wordCount = (s: string) => s.replace(/[—–-]/g, " ").split(/\s+/).filter((w) => /[a-z0-9]/i.test(w)).length;

/**
 * Split points for a recording holding several lines: for each boundary,
 * the pause whose position best matches where that line should end (by
 * share of words), taking the longer pause when two are close.
 */
function splitPoints(pcm: Buffer, ids: string[]): number[] {
  if (ids.length < 2) return [];
  const lv = levels(pcm);
  const gaps = pauses(lv).filter(([s, e]) => s > 0 && e < lv.length); // inner pauses only
  const loudIdx = lv.map((v, i) => (v >= -46 ? i : -1)).filter((i) => i >= 0);
  const first = loudIdx[0];
  const last = loudIdx[loudIdx.length - 1];
  const counts = ids.map((id) => wordCount(LINES[id]));
  const total = counts.reduce((a, b) => a + b, 0);
  const k = ids.length - 1;
  if (gaps.length < k) throw new Error(`not enough pauses to split ${ids.join(",")}`);
  const wants: number[] = [];
  let acc = 0;
  for (let b = 0; b < k; b++) {
    acc += counts[b];
    wants.push(first + ((last - first) * acc) / total);
  }
  // Cost of using a pause for a boundary: distance from where the line should
  // end, minus a bonus for longer pauses (sentence ends are the long ones).
  const cost = (b: number, g: [number, number]) => Math.abs((g[0] + g[1]) / 2 - wants[b]) - (g[1] - g[0]) * 1.5;
  // Choose k pauses, in order, with the lowest total cost (small DP).
  const G = gaps.length;
  const best: number[][] = Array.from({ length: k }, () => new Array(G).fill(Infinity));
  const from: number[][] = Array.from({ length: k }, () => new Array(G).fill(-1));
  for (let g = 0; g < G; g++) best[0][g] = cost(0, gaps[g]);
  for (let b = 1; b < k; b++) {
    for (let g = b; g < G; g++) {
      for (let p = b - 1; p < g; p++) {
        const c = best[b - 1][p] + cost(b, gaps[g]);
        if (c < best[b][g]) {
          best[b][g] = c;
          from[b][g] = p;
        }
      }
    }
  }
  let g = best[k - 1].indexOf(Math.min(...best[k - 1]));
  const chosen: number[] = [];
  for (let b = k - 1; b >= 0; b--) {
    chosen.unshift(g);
    g = from[b][g];
  }
  return chosen.map((i) => Math.round((gaps[i][0] + gaps[i][1]) / 2) * WIN);
}

/** Trim a clip's silent edges (keep 120ms before, 320ms after) and fade them. */
function trimEdges(pcm: Buffer): Buffer {
  const lv = levels(pcm);
  let a = 0;
  let b = lv.length - 1;
  while (a < lv.length && lv[a] < -50) a++;
  while (b > a && lv[b] < -50) b--;
  const n = samples(pcm);
  const first = Math.max(0, a * WIN - Math.round(RATE * 0.12));
  const last = Math.min(n - 1, (b + 1) * WIN + Math.round(RATE * 0.32));
  const out = Buffer.from(pcm.subarray(first * 2, (last + 1) * 2));
  const len = samples(out);
  const fade = (from: number, count: number, rising: boolean) => {
    for (let i = 0; i < count && from + i < len; i++) {
      const g = rising ? i / count : 1 - i / count;
      out.writeInt16LE(Math.round(out.readInt16LE((from + i) * 2) * g), (from + i) * 2);
    }
  };
  fade(0, Math.round(RATE * 0.01), true);
  const tail = Math.round(RATE * 0.08);
  fade(Math.max(0, len - tail), tail, false);
  return out;
}

/** Remove [start,end] second ranges, with a short crossfade at each join. */
function applyCuts(pcm: Buffer, cuts: Array<[number, number]>): Buffer {
  let out = pcm;
  for (const [s, e] of [...cuts].sort((x, y) => y[0] - x[0])) {
    const a = Math.round(s * RATE);
    const b = Math.round(e * RATE);
    const xf = Math.round(RATE * 0.012);
    const head = Buffer.from(out.subarray(0, a * 2));
    const tailBuf = Buffer.from(out.subarray(b * 2));
    for (let i = 0; i < xf && i < samples(head) && i < samples(tailBuf); i++) {
      const hi = samples(head) - xf + i;
      const g = i / xf;
      const mixed = Math.round(head.readInt16LE(hi * 2) * (1 - g) + tailBuf.readInt16LE(i * 2) * g);
      head.writeInt16LE(Math.max(-32768, Math.min(32767, mixed)), hi * 2);
    }
    out = Buffer.concat([head, tailBuf.subarray(xf * 2)]);
  }
  return out;
}

/**
 * Level each clip toward -16 LUFS, but by at most 3 dB: a line read softly
 * ("Alone tomorrow.") stays a little softer without getting lost on a phone
 * speaker. Never pushes peaks above -1.5 dBFS.
 */
function clipGainDb(pcm: Buffer): number {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-nostats", ...PCM_IN, "-af", "ebur128=peak=true", "-f", "null", "-"], {
    input: pcm,
    maxBuffer: 1 << 28,
  });
  const report = r.stderr.toString();
  const i = Number(report.match(/I:\s+(-?[\d.]+) LUFS/g)?.pop()?.match(/-?[\d.]+/)?.[0]);
  const peak = Number(report.match(/Peak:\s+(-?[\d.]+) dBFS/g)?.pop()?.match(/-?[\d.]+/)?.[0]);
  if (!Number.isFinite(i) || !Number.isFinite(peak)) return 0;
  const want = Math.max(-3, Math.min(3, -16 - i));
  return Math.min(want, -1.5 - peak);
}

function writeMp3(pcm: Buffer, file: string) {
  const gain = clipGainDb(pcm);
  const r = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-loglevel", "error", "-y", ...PCM_IN, "-af", `volume=${gain.toFixed(2)}dB`,
     "-codec:a", "libmp3lame", "-b:a", "96k", file],
    { input: pcm, maxBuffer: 1 << 28 }
  );
  if (r.status !== 0) throw new Error(`mp3 encode failed: ${r.stderr.toString().slice(-300)}`);
}

async function verify() {
  const { GoogleGenAI } = await import("@google/genai");
  const env = readFileSync(join(ROOT, ".env.local"), "utf-8");
  const ai = new GoogleGenAI({ apiKey: env.match(/^GOOGLE_API_KEY="?([^"\r\n]+)"?/m)![1] });
  const SAME: Record<string, string> = {
    burrow: "burro", burrows: "burros", "100": "one hundred", everyone: "every one", grace: "graze",
    zander: "xander", sanctuaries: "sanctuarys", braveheart: "brave herd", braveheard: "brave herd",
  };
  const words = (s: string) =>
    s.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean)
      .flatMap((w) => (SAME[w] ?? w).split(" "));
  const only = (process.argv.find((a) => a.startsWith("--only=")) ?? "").slice(7).split(",").filter(Boolean);
  const bad: string[] = [];
  for (const [id, text] of Object.entries(LINES)) {
    if (only.length && !only.includes(id)) continue;
    const audio = readFileSync(join(OUT, `${id}.mp3`)).toString("base64");
    let heard = "";
    for (let attempt = 1; attempt <= 4 && !heard; attempt++) {
      try {
        const res = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ role: "user", parts: [
            { inlineData: { mimeType: "audio/mp3", data: audio } },
            { text: "Transcribe this audio exactly, word for word, including any repeated, cut-off or partial word as you hear it. Output only the transcript." },
          ] }],
        });
        heard = res.text?.trim() ?? "";
      } catch (e) {
        await new Promise((r) => setTimeout(r, /429|quota|rate/i.test((e as Error).message) ? 20000 : 3000));
      }
    }
    const want = words(text);
    const got = words(heard);
    const ok = want.length === got.length && want.every((w, i) => w === got[i]);
    console.log(`${ok ? "ok  " : "DIFF"} ${id}${ok ? "" : `\n     want: ${want.join(" ")}\n     got:  ${got.join(" ")}`}`);
    if (!ok) bad.push(id);
  }
  console.log(bad.length ? `\nCheck: ${bad.join(", ")}` : "\nAll clips match their lines.");
}

async function main() {
  if (process.argv.includes("--verify")) return verify();
  const src = process.argv[2];
  if (!src || src.startsWith("--")) throw new Error("Pass the folder with the recordings.");
  mkdirSync(RAW, { recursive: true });
  const durations: Record<string, number> = {};
  for (const [name, ids] of RECORDINGS) {
    const file = join(src, `${name}.m4a`);
    if (!existsSync(file)) throw new Error(`missing recording: ${file}`);
    copyFileSync(file, join(RAW, `${name}.m4a`));
    let raw = decode(file);
    if (CUTS[name]) raw = applyCuts(raw, CUTS[name]);
    const pcm = masterPcm(raw);
    const cuts = splitPoints(pcm, ids);
    const bounds = [0, ...cuts, samples(pcm)];
    console.log(`${name}: ${(samples(pcm) / RATE).toFixed(2)}s${cuts.length ? `, split at ${cuts.map((c) => (c / RATE).toFixed(2) + "s").join(", ")}` : ""}`);
    ids.forEach((id, i) => {
      const piece = trimEdges(Buffer.from(pcm.subarray(bounds[i] * 2, bounds[i + 1] * 2)));
      writeMp3(piece, join(OUT, `${id}.mp3`));
      durations[id] = Math.round((samples(piece) / RATE) * 1000) / 1000;
      console.log(`  ${id}: ${durations[id].toFixed(2)}s`);
    });
  }
  const missing = Object.keys(LINES).filter((id) => !durations[id]);
  if (missing.length) throw new Error(`no recording for: ${missing.join(", ")}`);
  writeFileSync(DUR_JSON, JSON.stringify(durations, null, 1));
  const body = Object.keys(LINES).map((id) => `  ${JSON.stringify(id)}: ${durations[id]},`).join("\n");
  writeFileSync(
    TS_OUT,
    `// GENERATED by scripts/master-film-voice.ts — do not edit by hand.\n` +
      `// Exact length (seconds) of each narration clip in public/audio/film/.\n` +
      `// The film derives every scene duration and text-arrival time from these.\n\n` +
      `export const NARR: Record<string, number> = {\n${body}\n};\n`
  );
  const total = Object.values(durations).reduce((a, b) => a + b, 0);
  console.log(`\nDONE: ${Object.keys(durations).length} clips, ${total.toFixed(1)}s of narration.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
