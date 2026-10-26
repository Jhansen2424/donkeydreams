"use client";

// ── The new homepage: one day, dawn to dark ──
// A documentary-style single scroll. The page's ambient light moves through
// a desert day as you scroll; a sun travels the film-timeline progress bar
// and becomes a moon for the night chapter. Key scenes PIN fullscreen and
// the story advances inside the held frame (the "You Are Here" montage), and
// "The Vision" literally closes four fence lines around the reader before
// breaking open into sunrise — the donation ask is the dawn.
//
// All copy is VERBATIM from the approved 10/8 doc. Photos are labeled
// placeholder frames until the real exports land. Narration is opt-in via
// the floating "Listen to the story" pill (see Narrator.tsx); chapters are
// tagged with data-narration ids.
//
// CTAs route to the closest existing pages:
//   Hear Their Stories → /donkeys · Save More Families → /how-to-help
//   Make an Impact → /donate · Our Story → /our-story

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionTemplate,
  useInView,
  useReducedMotion,
  type MotionValue,
} from "motion/react";
import { Play, ChevronDown } from "lucide-react";
import Narrator from "./Narrator";
import SceneArt, { Donkey, type SceneKind, type SceneTone } from "./SceneArt";

const display = { fontFamily: "var(--font-fraunces), Georgia, serif" };

// ── Primitives ──

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ duration: 0.9, delay, ease: [0.22, 0.6, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Documentary lower-third: an amber bar draws in, then the name settles. */
function LowerThird({ name }: { name: string }) {
  return (
    <div className="absolute left-4 bottom-14 flex items-center gap-2.5 pointer-events-none">
      <motion.span
        className="w-1 rounded-full bg-[#e2963f] origin-bottom"
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true, margin: "-10% 0px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{ height: "1.9rem" }}
      />
      <motion.span
        className="text-xl text-white italic [text-shadow:0_1px_8px_rgba(0,0,0,0.45)]"
        style={display}
        initial={{ opacity: 0, x: -10 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-10% 0px" }}
        transition={{ duration: 0.7, delay: 0.25 }}
      >
        {name}
      </motion.span>
    </div>
  );
}

/** Illustrated film frame standing in for a photo that hasn't been exported
    yet — a layered desert scene with donkey silhouettes (see SceneArt). The
    tiny chip names the real photo that will replace it. */
function Photo({
  label,
  name,
  tone = "gold",
  scene = "herd",
  ratio = "aspect-[3/2]",
  className = "",
}: {
  label: string;
  /** Documentary lower-third name tag (e.g. "Dusk & Dawn"). */
  name?: string;
  tone?: SceneTone;
  scene?: SceneKind;
  ratio?: string;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl ring-1 ring-white/15 ${ratio} ${className}`}>
      <SceneArt tone={tone} kind={scene} />
      {name && <LowerThird name={name} />}
      <div className="absolute inset-0 flex items-end justify-end p-3">
        <p className="text-[10px] leading-snug font-semibold uppercase tracking-wider text-white/70 bg-black/25 backdrop-blur-sm rounded-md px-2 py-1 max-w-[70%] text-right">
          Photo · {label}
        </p>
      </div>
    </div>
  );
}

// ── Cold open: a film prologue before the first light ──
// (New connective copy, not from the 10/8 doc — flag for client approval.)

function ColdOpen() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const line1 = useTransform(scrollYProgress, [0.04, 0.16, 0.36, 0.46], [0, 1, 1, 0]);
  const line2 = useTransform(scrollYProgress, [0.46, 0.58, 0.78, 0.86], [0, 1, 1, 0]);
  const panel = useTransform(scrollYProgress, [0.86, 1], [1, 0]);
  // Slow fade: on phones the address-bar collapse alone scrolls ~100px, and
  // the old 8%-window killed the Play button (visually AND its pointer
  // events) before anyone could tap it — "play doesn't work" (client 10/12).
  const hint = useTransform(scrollYProgress, [0.04, 0.26], [1, 0]);
  // Stays tappable while it's meaningfully visible; inert only once faded.
  const hintPointer = useTransform(hint, (v) => (v < 0.4 ? "none" : "auto"));

  return (
    <section ref={ref} className="relative h-[260vh]">
      {/* 100svh, not 100vh: iOS counts the URL bar into vh and clips the
          bottom of every pinned frame (client: "looks like shit on mobile"). */}
      <motion.div
        className="sticky top-0 h-[100svh] bg-[#0d0a07] flex items-center justify-center px-8"
        style={{ opacity: panel }}
      >
        <motion.p
          className="absolute text-center text-2xl sm:text-4xl lg:text-5xl font-medium leading-snug text-[#efe8da] max-w-3xl"
          style={{ opacity: line1, ...display }}
        >
          Somewhere in the Arizona desert…
        </motion.p>
        <motion.p
          className="absolute text-center text-2xl sm:text-4xl lg:text-5xl font-medium leading-snug text-[#efe8da] max-w-3xl"
          style={{ opacity: line2, ...display }}
        >
          …there's a place where wild burro families never have to say goodbye.
        </motion.p>
        {/* How to watch: press play (narrated, self-scrolling) or scroll.
            Fades away the moment they start, either way. */}
        {/* bottom-24 on phones: iOS Safari's floating tab bar overlays the
            bottom ~50px of the page and eats taps there. */}
        <motion.div
          className="absolute bottom-24 md:bottom-10 inset-x-0 z-10 flex flex-col items-center gap-5"
          style={{ opacity: hint, pointerEvents: hintPointer }}
        >
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => window.dispatchEvent(new Event("dd:play-story"))}
              className="inline-flex items-center gap-2.5 pl-4 pr-6 py-3.5 rounded-full bg-[#e2963f] text-[#241d14] text-base font-bold hover:bg-[#efc98c] transition-colors shadow-[0_0_30px_rgba(226,150,63,0.35)]"
            >
              <Play className="w-5 h-5" />
              Listen to the story
            </button>
            <span className="text-xs text-[#efe8da]/65">
              a narrator reads each chapter as you scroll
            </span>
          </div>
          <div className="flex flex-col items-center gap-1.5 text-[#efe8da]/55">
            <span className="text-[11px] font-bold uppercase tracking-[0.3em]">
              or scroll at your own pace
            </span>
            <ChevronDown className="w-5 h-5 animate-bounce" />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

function Kicker({ n, title, light }: { n: string; title: string; light?: boolean }) {
  return (
    <Reveal>
      <div className="flex items-center gap-4 mb-6">
        <span
          className={`text-[11px] font-bold uppercase tracking-[0.25em] ${
            light ? "text-white/60" : "text-[#9a6a1f]"
          }`}
        >
          Ch. {n} · {title}
        </span>
        <span className={`h-px flex-1 ${light ? "bg-white/20" : "bg-[#241d14]/15"}`} />
      </div>
    </Reveal>
  );
}

function CountUp({ value, suffix }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });
  const reduce = useReducedMotion();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setN(value);
      return;
    }
    const start = performance.now();
    const dur = 1600;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, reduce]);
  return (
    <span ref={ref}>
      {n}
      {suffix}
    </span>
  );
}

// ── Mom-child pairs wall: 40 pairs materialize one by one ──

function PairGlyph({ className }: { className?: string }) {
  // Simplified from the site's DonkeySilhouettes walking donkey: an adult
  // and, tucked beside her, a smaller foal.
  const body = (
    <>
      <ellipse cx="60" cy="50" rx="30" ry="18" />
      <path d="M82 42 Q88 28 84 18 Q82 14 78 14 Q74 14 73 18 Q70 28 75 42Z" />
      <ellipse cx="81" cy="14" rx="10" ry="7" />
      <ellipse cx="90" cy="16" rx="5" ry="4" />
      <path d="M76 8 Q74 -2 72 0 Q70 2 74 9Z" />
      <path d="M80 7 Q80 -3 82 -1 Q84 1 82 8Z" />
      <path d="M72 64 L74 88 L78 88 L76 64Z" />
      <path d="M80 62 L86 86 L90 86 L84 62Z" />
      <path d="M40 64 L36 88 L40 88 L44 64Z" />
      <path d="M46 64 L50 88 L54 88 L50 64Z" />
    </>
  );
  return (
    <svg viewBox="0 0 190 100" fill="currentColor" className={className} aria-hidden>
      <g>{body}</g>
      <g transform="translate(118 38) scale(0.58) scale(-1,1) translate(-120 0)">{body}</g>
    </svg>
  );
}

function PairsWall() {
  const reduce = useReducedMotion();
  return (
    <div>
      <div className="flex flex-wrap justify-center gap-x-2 gap-y-1.5 max-w-xl mx-auto">
        {Array.from({ length: 40 }).map((_, i) => (
          <motion.span
            key={i}
            className="text-[#9a6a1f]/80 w-9"
            initial={reduce ? false : { opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15% 0px" }}
            transition={{ duration: 0.4, delay: reduce ? 0 : i * 0.035 }}
          >
            <PairGlyph />
          </motion.span>
        ))}
      </div>
      <p className="text-center text-sm font-medium text-[#746a5a] mt-4">
        <span className="font-semibold text-[#241d14]">
          <CountUp value={40} suffix="+" />
        </span>{" "}
        mom-child pairs — every one of them still together
      </p>
    </div>
  );
}

// ── Pinned scene: "You Are Here" (Ch. 01) ──
// The scene holds fullscreen while three beats crossfade through it.

const YOU_ARE_HERE_BEATS = [
  {
    label: "The wilds at sunset after a full day roaming, playing, napping",
    tone: "amber" as const,
    scene: "herd" as const,
    name: undefined as string | undefined,
    text: "Roaming. Playing. Napping. And now, dinner, as the sun goes down — a full day lived entirely on their own terms.",
  },
  {
    label: "Brave Herd, dusk, feeding trough",
    tone: "dusk" as const,
    scene: "herd" as const,
    name: "The Brave Herd",
    text: "They don't eat where we put them. They eat beside who they trust.",
  },
  {
    label: "Dusk and Dawn, mother and daughter",
    tone: "dawn" as const,
    scene: "pair" as const,
    name: "Dusk & Dawn",
    text: "This is Dusk and Dawn — named for the same light at opposite ends of the day. Here, they'll grow old together. Never separated. That's the wild burro spirit, preserved.",
  },
];

/** Cinema letterbox bars that slide in while a scene is pinned. */
function Letterbox({ progress }: { progress: MotionValue<number> }) {
  const reach = useTransform(progress, [0, 0.07, 0.93, 1], [0, 1, 1, 0]);
  const topY = useTransform(reach, (v) => `${(v - 1) * 100}%`);
  const bottomY = useTransform(reach, (v) => `${(1 - v) * 100}%`);
  return (
    <>
      <motion.div className="absolute top-0 inset-x-0 h-[5vh] bg-[#0d0a07] z-20" style={{ y: topY }} />
      <motion.div className="absolute bottom-0 inset-x-0 h-[5vh] bg-[#0d0a07] z-20" style={{ y: bottomY }} />
    </>
  );
}

function PinnedBeat({
  progress,
  index,
  count,
  beat,
}: {
  progress: MotionValue<number>;
  index: number;
  count: number;
  beat: (typeof YOU_ARE_HERE_BEATS)[number];
}) {
  const span = 1 / count;
  const start = index * span;
  const end = start + span;
  const fade = span * 0.22;
  const opacity = useTransform(
    progress,
    index === 0
      ? [start, end - fade, end]
      : index === count - 1
        ? [start, start + fade, end]
        : [start, start + fade, end - fade, end],
    index === 0 ? [1, 1, 0] : index === count - 1 ? [0, 1, 1] : [0, 1, 1, 0]
  );
  const y = useTransform(progress, [start, end], [24, -24]);
  return (
    <motion.div
      style={{ opacity }}
      className="absolute inset-0 flex items-center px-6 pt-24 md:pt-0"
    >
      <div className="max-w-5xl mx-auto w-full grid md:grid-cols-2 gap-5 md:gap-8 items-center">
        <Photo
          label={beat.label}
          tone={beat.tone}
          scene={beat.scene}
          name={beat.name}
          ratio="aspect-[16/10] md:aspect-[4/3]"
        />
        <motion.p
          style={{ y, ...display }}
          className="text-xl sm:text-2xl lg:text-4xl leading-snug font-medium"
        >
          {beat.text}
        </motion.p>
      </div>
    </motion.div>
  );
}

// NOTE: the pinned scenes run for everyone, including prefers-reduced-motion.
// They're scroll-SCRUBBED — the user's own scrolling drives every frame, and
// stopping scrolling stops all motion — which reduced-motion guidance treats
// differently from autonomous animation. (The OS flag was also silently
// serving a flat page to anyone with Windows animations off — the client
// reviewed THAT by accident on 10/12 and thought the redesign was broken.)

function YouAreHere() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  return (
    <section data-narration="youarehere" ref={ref} className="relative h-[340vh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <Letterbox progress={scrollYProgress} />
        <div className="absolute top-20 inset-x-6">
          <div className="max-w-5xl mx-auto">
            <Kicker n="01" title="You are here" />
          </div>
        </div>
        {YOU_ARE_HERE_BEATS.map((beat, i) => (
          <PinnedBeat
            key={beat.label}
            progress={scrollYProgress}
            index={i}
            count={YOU_ARE_HERE_BEATS.length}
            beat={beat}
          />
        ))}
      </div>
    </section>
  );
}

// ── Pinned scene: "The Vision" (Ch. 09) ──
// Night. Four fence lines close in around the reader — the pen the copy
// describes — then the frame breaks open and sunrise floods in.

const VISION_BEATS = [
  "Somewhere right now, a burro is standing in a pen. Four fence lines, and nothing past them — no hillside, no herd, no one who knows their name. They were built to cover ground, to belong to someone. Now they have neither.",
  "Every day they stand there, a little more of the wild burro spirit goes quiet.",
  "We believe they deserve more than survival. They deserve this: a family to belong to, room to roam, sovereignty honored — not someday, but as soon as we can build it.",
];

// Each beat gets its own full-frame flex wrapper for centering. NEVER mix
// Tailwind translate utilities with motion transform values on the same
// element — motion owns `transform` and silently erases the CSS centering
// (that's how "Every Wild Burro Deserves This" ended up anchored to the top
// of the frame — client, 10/12).
function VisionBeatText({
  progress,
  window: [start, end],
  children,
  big,
}: {
  progress: MotionValue<number>;
  window: [number, number];
  children: ReactNode;
  big?: boolean;
}) {
  const fade = (end - start) * 0.25;
  const opacity = useTransform(progress, [start, start + fade, end - fade, end], [0, 1, 1, 0]);
  const y = useTransform(progress, [start, end], [16, -16]);
  return (
    <div className="absolute inset-0 flex items-center justify-center px-8 pointer-events-none">
      <motion.p
        style={{ opacity, y, ...(big ? display : {}) }}
        className={`text-center ${
          big
            ? "text-2xl sm:text-4xl lg:text-5xl font-medium leading-snug max-w-2xl"
            : "text-base sm:text-xl leading-relaxed text-[#efe8da]/90 max-w-xl"
        }`}
      >
        {children}
      </motion.p>
    </div>
  );
}

function TheVision() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  // The pen: a frame that closes from beyond the viewport down to a tight
  // box, holds through the darkest line, then shatters outward as dawn
  // breaks. (All scroll-scrubbed — scrolling back re-opens the pen.)
  const frameW = useTransform(scrollYProgress, [0.02, 0.4], ["140vw", "min(680px, 88vw)"]);
  const frameH = useTransform(scrollYProgress, [0.02, 0.4], ["130svh", "min(460px, 58svh)"]);
  const frameOpacity = useTransform(scrollYProgress, [0.02, 0.12, 0.8, 0.88], [0, 1, 1, 0]);
  const frameScale = useTransform(scrollYProgress, [0.8, 0.95], [1, 1.8]);
  const starsOpacity = useTransform(scrollYProgress, [0, 0.75, 0.9], [0.5, 0.5, 0]);
  const dawnOpacity = useTransform(scrollYProgress, [0.78, 0.95], [0, 1]);
  const ctaOpacity = useTransform(scrollYProgress, [0.86, 0.96], [0, 1]);
  const ctaY = useTransform(scrollYProgress, [0.86, 0.96], [24, 0]);
  // The lone donkey standing inside the pen — arrives with the fences,
  // stays through the quiet line, lifts their head free as dawn breaks.
  const loneOpacity = useTransform(scrollYProgress, [0.18, 0.28, 0.8, 0.9], [0, 0.95, 0.95, 0]);
  const loneY = useTransform(scrollYProgress, [0.18, 0.9], [8, -4]);

  return (
    <section data-narration="vision" ref={ref} className="relative h-[420vh] bg-[#15100b] text-[#efe8da]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <Letterbox progress={scrollYProgress} />
        {/* stars */}
        <motion.div
          className="absolute inset-0"
          style={{
            opacity: starsOpacity,
            backgroundImage:
              "radial-gradient(1px 1px at 12% 22%, #fff8, transparent), radial-gradient(1px 1px at 38% 65%, #fff6, transparent), radial-gradient(1.5px 1.5px at 60% 18%, #fff7, transparent), radial-gradient(1px 1px at 78% 48%, #fff5, transparent), radial-gradient(1px 1px at 90% 80%, #fff6, transparent), radial-gradient(1.5px 1.5px at 25% 85%, #fff5, transparent)",
          }}
        />
        {/* dawn breaking from below */}
        <motion.div
          className="absolute inset-0"
          style={{
            opacity: dawnOpacity,
            background:
              "radial-gradient(120% 90% at 50% 115%, #e2963f 0%, #b5592e 32%, rgba(21,16,11,0) 70%)",
          }}
        />

        <div className="absolute top-20 inset-x-6">
          <div className="max-w-3xl mx-auto">
            <Kicker n="09" title="The vision" light />
          </div>
        </div>

        {/* headline fades up first, then yields to the pen */}
        <VisionBeatText progress={scrollYProgress} window={[0.0, 0.16]} big>
          Every Wild Burro Deserves This
        </VisionBeatText>

        {/* the pen — four fence lines closing in (flex-centered; motion only
            animates size/opacity/scale, never position) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            className="relative border-2 border-[#efe8da]/50 rounded-sm"
            style={{ width: frameW, height: frameH, opacity: frameOpacity, scale: frameScale }}
          >
            <div className="absolute inset-2 border border-[#efe8da]/20 rounded-sm" />
          </motion.div>
        </div>

        {/* the lone donkey, standing inside the pen */}
        <div className="absolute inset-x-0 bottom-[14svh] flex justify-center pointer-events-none">
          <motion.div className="w-20 sm:w-28" style={{ opacity: loneOpacity, y: loneY }}>
            <svg viewBox="0 0 100 100" className="w-full">
              <Donkey x={32} scale={1.1} color="#3a3025" />
            </svg>
          </motion.div>
        </div>

        {/* beats inside the pen */}
        <VisionBeatText progress={scrollYProgress} window={[0.16, 0.44]}>
          {VISION_BEATS[0]}
        </VisionBeatText>
        <VisionBeatText progress={scrollYProgress} window={[0.44, 0.68]} big>
          {VISION_BEATS[1]}
        </VisionBeatText>
        <VisionBeatText progress={scrollYProgress} window={[0.68, 0.9]}>
          {VISION_BEATS[2]}
        </VisionBeatText>

        {/* dawn breaks — the ask */}
        <motion.div
          className="absolute inset-x-0 bottom-[12svh] text-center"
          style={{ opacity: ctaOpacity, y: ctaY }}
        >
          <Link
            href="/donate"
            className="inline-block px-9 py-4 rounded-full bg-[#e2963f] text-[#241d14] text-lg font-bold hover:bg-[#efc98c] transition-colors shadow-2xl"
          >
            Make an Impact →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// ── Idle scroll cue ──
// The pinned scenes make people think the page "stopped". After a few idle
// seconds (not during cinema mode, the cold open, or near the end) a gentle
// "keep scrolling" chevron fades up; any scroll hides it again.

function ScrollCue() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const arm = () => {
      setVisible(false);
      clearTimeout(timer);
      timer = setTimeout(() => {
        const nearBottom =
          window.innerHeight + window.scrollY > document.body.scrollHeight - 900;
        const inColdOpen = window.scrollY < window.innerHeight * 1.5;
        if (!nearBottom && !inColdOpen) {
          setVisible(true);
        }
      }, 3500);
    };
    window.addEventListener("scroll", arm, { passive: true });
    arm();
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", arm);
    };
  }, []);
  return (
    <div
      className={`fixed bottom-16 md:bottom-5 inset-x-0 z-40 flex justify-center pointer-events-none transition-opacity duration-700 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="flex flex-col items-center gap-0.5 text-[#241d14]/60 bg-[#f6f0e4]/75 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm">
        <span className="text-[10px] font-bold uppercase tracking-[0.25em]">keep scrolling</span>
        <ChevronDown className="w-4 h-4 animate-bounce" />
      </div>
    </div>
  );
}

// ── Nav + footer (per the 10/8 doc) ──

const NAV = [
  { label: "Our Story", href: "/our-story" },
  { label: "Hear Their Stories", href: "/donkeys" },
  { label: "Save More Families", href: "/how-to-help" },
  { label: "Make an Impact", href: "/donate" },
];

function StoryNav() {
  return (
    <header className="fixed top-0 inset-x-0 z-40">
      <div className="bg-[#f6f0e4]/80 backdrop-blur-md border-b border-[#241d14]/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="font-bold text-[#241d14] tracking-tight" style={display}>
            Donkey Dreams
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-[#3a3025] hover:text-[#b5592e] transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/donate"
            className="shrink-0 px-4 py-2 rounded-full bg-[#e2963f] text-[#241d14] text-sm font-bold hover:bg-[#c87f2f] transition-colors"
          >
            Donate Now
          </Link>
        </div>
      </div>
    </header>
  );
}

function StoryFooter() {
  return (
    <footer className="bg-[#241d14] text-[#efe8da] px-6 py-14">
      <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-10">
        <div className="space-y-2">
          <p className="text-xl font-semibold" style={display}>
            Donkey Dreams Sanctuary
          </p>
          <p className="text-sm text-[#b6a996]">Preserving the Wild Burro Spirit</p>
          <p className="text-sm text-[#b6a996]">
            A GFAS-Accredited 501(c)(3) Nonprofit · EIN 81-3650509
          </p>
          <p className="text-sm text-[#b6a996]">All donations are 100% tax deductible.</p>
          <div className="flex flex-wrap gap-2 pt-3">
            {["GFAS Accredited", "Candid Platinum", "Homes for Horses", "Guardian Seal 2026"].map(
              (seal) => (
                <span
                  key={seal}
                  className="text-[10px] font-bold uppercase tracking-wider border border-[#efe8da]/25 rounded-full px-2.5 py-1 text-[#efe8da]/70"
                >
                  {seal}
                </span>
              )
            )}
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#b6a996] mb-3">
            Explore
          </p>
          {[{ label: "Home", href: "/" }, ...NAV].map((item) => (
            <Link key={item.label} href={item.href} className="block hover:text-white transition-colors">
              {item.label}
            </Link>
          ))}
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#b6a996] pt-4 pb-1">
            Governance
          </p>
          <a href="/docs/donkey-dreams-board-of-directors.pdf" target="_blank" rel="noopener" className="block text-[#b6a996] hover:text-white transition-colors">
            Board of Directors
          </a>
          <a href="/docs/donkey-dreams-sop-january-2025.pdf" target="_blank" rel="noopener" className="block text-[#b6a996] hover:text-white transition-colors">
            Standard Operating Procedures
          </a>
        </div>
        <div className="space-y-2 text-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#b6a996] mb-3">
            Visit & Connect
          </p>
          <p>
            3900 N Stockton Hill Rd, Ste B368
            <br />
            Kingman, AZ 86409
          </p>
          <a href="mailto:amber@donkeydreams.org" className="block hover:text-white transition-colors">
            amber@donkeydreams.org
          </a>
          <div className="flex gap-4 pt-2 text-[#b6a996]">
            {["Instagram", "Facebook", "YouTube", "TikTok"].map((s) => (
              <span key={s} className="hover:text-white transition-colors cursor-pointer">
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
      <p className="max-w-5xl mx-auto text-xs text-[#b6a996]/70 mt-10">
        © 2026 Donkey Dreams Sanctuary. All rights reserved.
      </p>
    </footer>
  );
}

// ── The page ──

export default function StoryHome() {
  const { scrollYProgress } = useScroll();

  // Ambient sky behind the light chapters (dark chapters carry their own).
  const skyTop = useTransform(
    scrollYProgress,
    [0, 0.3, 0.6, 1],
    ["#fbf7ee", "#f8edd6", "#f4dfbc", "#f1d5ab"]
  );
  const skyBottom = useTransform(
    scrollYProgress,
    [0, 0.3, 0.6, 1],
    ["#f3e7d3", "#efc98c", "#dd9a56", "#d08440"]
  );
  const sky = useMotionTemplate`linear-gradient(to bottom, ${skyTop}, ${skyBottom})`;

  // The sun crosses the timeline as the day passes; during the night chapter
  // it hands over to the moon, and returns for the sunrise finale.
  const sunX = useTransform(scrollYProgress, [0, 1], ["3vw", "94vw"]);
  const sunColor = useTransform(
    scrollYProgress,
    [0, 0.45, 0.72],
    ["#f0c75e", "#e2963f", "#b5592e"]
  );
  const sunOpacity = useTransform(scrollYProgress, [0, 0.72, 0.78, 0.94, 0.97], [1, 1, 0, 0, 1]);
  const moonOpacity = useTransform(scrollYProgress, [0.72, 0.78, 0.92, 0.96], [0, 1, 1, 0]);

  return (
    <div className="text-[#241d14] antialiased">
      <motion.div className="fixed inset-0 -z-10" style={{ background: sky }} />

      {/* film-timeline progress + travelling sun/moon */}
      <motion.div
        className="fixed top-0 inset-x-0 h-[3px] z-50 bg-[#b5592e] origin-left"
        style={{ scaleX: scrollYProgress }}
      />
      <motion.div
        className="fixed top-[7px] z-50 w-3.5 h-3.5 rounded-full pointer-events-none"
        style={{
          left: sunX,
          backgroundColor: sunColor,
          opacity: sunOpacity,
          boxShadow: "0 0 12px 3px rgba(226,150,63,0.55)",
        }}
      />
      <motion.div
        className="fixed top-[7px] z-50 w-3.5 h-3.5 rounded-full pointer-events-none bg-[#e8e4da]"
        style={{
          left: sunX,
          opacity: moonOpacity,
          boxShadow: "0 0 10px 2px rgba(232,228,218,0.4)",
        }}
      >
        {/* crescent bite */}
        <span className="absolute -right-0.5 -top-0.5 w-2.5 h-2.5 rounded-full bg-[#15100b]" />
      </motion.div>

      {/* film grain over everything, very faint */}
      <div
        className="fixed inset-0 z-[55] pointer-events-none opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), radial-gradient(rgba(0,0,0,0.8) 1px, transparent 1px)",
          backgroundSize: "3px 3px, 5px 5px",
          backgroundPosition: "0 0, 1px 2px",
        }}
      />

      <StoryNav />
      <Narrator />
      <ScrollCue />

      {/* ═══ 0 · COLD OPEN ═══ */}
      <ColdOpen />

      {/* ═══ 1 · HERO ═══ */}
      <section data-narration="hero" className="min-h-[100svh] flex flex-col justify-center px-6 pt-24 pb-16">
        <div className="max-w-5xl mx-auto w-full">
          <Reveal>
            <p className="text-[12px] font-bold uppercase tracking-[0.3em] text-[#9a6a1f] mb-6">
              Kingman, Arizona · A wild burro sanctuary
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <h1
              className="text-5xl sm:text-7xl lg:text-8xl font-semibold leading-[1.02] tracking-tight"
              style={display}
            >
              Preserving the Wild Burro Spirit
            </h1>
          </Reveal>
          <Reveal delay={0.3}>
            <p className="text-lg sm:text-xl text-[#3a3025] max-w-2xl mt-6 leading-relaxed">
              We give entire wild burro families a forever home — together, with room
              to roam, and the freedom to still be who they are.
            </p>
          </Reveal>
          <Reveal delay={0.45}>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link
                href="/donkeys"
                className="px-6 py-3 rounded-full bg-[#241d14] text-[#f6f0e4] font-bold hover:bg-[#3a3025] transition-colors"
              >
                Hear Their Stories
              </Link>
              <Link
                href="/donate"
                className="px-6 py-3 rounded-full border-2 border-[#241d14]/25 font-bold hover:border-[#b5592e] hover:text-[#b5592e] transition-colors"
              >
                Keep Them Together
              </Link>
            </div>
          </Reveal>
          <Reveal delay={0.6}>
            <Photo
              label="The wilds at sunset — dinner, distinctive peak silhouetted against the setting sun (panoramic)"
              tone="amber"
              scene="herd"
              ratio="aspect-[21/9]"
              className="mt-12"
            />
          </Reveal>
        </div>
      </section>

      {/* ═══ 2 · YOU ARE HERE (pinned montage) ═══ */}
      <YouAreHere />

      {/* ═══ 3 · THE FAMILY CASE ═══ */}
      <section data-narration="familycase" className="px-6 py-24">
        <div className="max-w-3xl mx-auto">
          <Kicker n="02" title="The family case" />
          <Reveal>
            <h2 className="text-4xl sm:text-6xl font-semibold leading-tight mb-10" style={display}>
              Wild and Free Today. Alone Tomorrow.
            </h2>
          </Reveal>
          {[
            "In the wild, a burro's life revolves around family — a mother close by, a sibling, a herd they've known for years, grazing together, moving together, watching out for one another. Freedom, for a burro, means family — and it's not just behavior. A burro's limbic system — the part of the brain that governs emotion, memory, and bonding — works the same way ours does. They don't just form those bonds; they feel them, the same way we feel love, and the same way we feel it when we lose someone we love. Those bonds are real, and they run deep.",
            "When they're removed from the wild, that changes in an instant. One moment they're part of a herd that's never been apart. The next, they're alone — family scattered, a new world that looks nothing like the one they knew. Too often, what comes next isn't a wild burro habitat at all. It's a pen. A corral. The same four fence lines, every day, for the rest of their lives — with no family left to stand beside. This is what tends to happen when a wild animal enters a world catering to what the people who manage them need, not what they need. They don't just lose their freedom. They carry what they lost.",
            "That's the gap Donkey Dreams exists to close — a place where burros removed from the wild can live out their lives with family intact, in a wild burro habitat catering to who they are, on their own terms.",
          ].map((para, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <p className="text-lg leading-relaxed text-[#3a3025] mb-6">{para}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══ 4 · OUR PROMISE ═══ */}
      <section data-narration="promise" className="px-6 py-24">
        <div className="max-w-4xl mx-auto">
          <Kicker n="03" title="Our promise" />
          <Reveal>
            <h2 className="text-4xl sm:text-5xl font-semibold leading-tight mb-8" style={display}>
              Saving Them Together, Not One at a Time
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-lg leading-relaxed text-[#3a3025] mb-6">
              At Donkey Dreams, burros removed from the wild get back the life they once
              had. We believe that takes three things: keeping their families whole,
              because a burro without their herd isn't complete. A wild burro habitat,
              with room to roam the way they once did. And their sovereignty honored —
              their right to still be who they are, even in our care.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="text-lg leading-relaxed text-[#3a3025] mb-14">
              Nearly 100 donkeys and wild burros live at Donkey Dreams today. Most
              arrived as family; some arrived alone and found one here — either way, no
              one goes it alone. As long as burros are being removed from the wild,
              we'll keep finding room for as many families as we can.
            </p>
          </Reveal>
          <div className="bg-white/50 backdrop-blur rounded-2xl border border-[#241d14]/10 px-6 py-10 space-y-10">
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <p className="text-4xl sm:text-5xl font-semibold text-[#241d14]" style={display}>
                  <CountUp value={100} />
                </p>
                <p className="text-sm font-medium text-[#746a5a] mt-1">
                  Donkeys &amp; Burros (nearly)
                </p>
              </div>
              <div className="text-center">
                <p className="text-4xl sm:text-5xl font-semibold text-[#241d14]" style={display}>
                  GFAS
                </p>
                <p className="text-sm font-medium text-[#746a5a] mt-1">Accredited Sanctuary</p>
              </div>
            </div>
            <PairsWall />
          </div>
        </div>
      </section>

      {/* ═══ 5 · ROOM TO ROAM ═══ */}
      <section data-narration="roam" className="px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <Kicker n="04" title="Room to roam" />
          <div className="grid sm:grid-cols-2 gap-8">
            {(
              [
                {
                  head: "Graze",
                  label: "Sparse hillside herd, soft morning light",
                  tone: "dawn",
                  scene: "herd",
                  name: undefined,
                  text: "No rush to breakfast at base camp. Just hanging on the ridge with friends and family, picking up a few nibbles along the way.",
                },
                {
                  head: "Run",
                  label: "Dust and motion, summer evening",
                  tone: "gold",
                  scene: "run",
                  name: undefined,
                  text: "Dinner, then out to run — rocky, steep ground where their bodies are designed to thrive.",
                },
                {
                  head: "Trail",
                  label: "Self-made trails across the property",
                  tone: "amber",
                  scene: "land",
                  name: undefined,
                  text: "Their own trails, their own loop — out across the sanctuary and back to base camp when they're ready, not when we say.",
                },
                {
                  head: "Nap",
                  label: "Moses and Nelly Belle, nose-to-tail in the shade of a tree",
                  tone: "dusk",
                  scene: "pair",
                  name: "Nelly Belle & Moses",
                  text: "Nelly Belle and Moses, a mother/son pair from the wild. Separated through adoption, reunited here — inseparable ever since.",
                },
              ] as const
            ).map((card, i) => (
              <Reveal key={card.head} delay={i * 0.1}>
                <div>
                  <Photo label={card.label} tone={card.tone} scene={card.scene} name={card.name} />
                  <h3 className="text-2xl font-semibold mt-5 mb-2" style={display}>
                    {card.head}
                  </h3>
                  <p className="text-[#3a3025] leading-relaxed">{card.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 6 · TRUST, NOT CONTROL ═══ */}
      {/* The light begins to fade — same warm stock, first step down. */}
      <section data-narration="trust" className="bg-gradient-to-b from-[#5e4631] to-[#45331f] text-[#f6f0e4] px-6 py-28">
        <div className="max-w-3xl mx-auto">
          <Kicker n="05" title="Trust, not control" light />
          {[
            "In the wild, a burro decides how to spend their day. Where to graze. When to rest. Who to stand beside. We don't take that away just because they need care. Sovereignty, to us, means they get a say — that their needs carry the same weight as ours, the sanctuary's, anyone's. They aren't something we manage. They're someone we listen to.",
            "When a donkey needs treatment — a sore hoof, medicine, a watchful eye on a healing wound — our caretakers go to them, wherever they are, instead of pulling them away from their family and freedom to make it easier on us. We don't run them in herds to get it done, and we don't chase them to make it quicker — many of them were already chased once, the day they left the wild, and we won't ask them to relive that just to make a checkup easier on us. The question we ask isn't what's most convenient for the humans caring for them. It's what this animal would experience if they were still in the wild, and how we give them that same relief without taking their freedom away.",
            "To be clear: every donkey gets the care they need, fully. What's different is how we get there.",
          ].map((para, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <p className="text-lg leading-relaxed text-[#f6f0e4]/90 mb-6">{para}</p>
            </Reveal>
          ))}
          <Reveal delay={0.2}>
            <p className="text-2xl sm:text-3xl font-medium leading-snug my-10" style={display}>
              We call it sovereignty: their right to still be who they are — not
              managed, not overridden, but met as an equal — even while we're taking
              care of them.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <Photo label="Amber and Dusk, nose to nose" name="Amber & Dusk" tone="dusk" scene="pair" ratio="aspect-[16/9]" />
          </Reveal>
        </div>
      </section>

      {/* ═══ 7 · THEIR STORIES ═══ */}
      <section data-narration="stories" className="px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <Kicker n="06" title="Their stories" />
          <Reveal>
            <h2 className="text-4xl sm:text-5xl font-semibold leading-tight mb-14" style={display}>
              Every Burro, Every Family Has a Story
            </h2>
          </Reveal>
          <div className="space-y-20">
            {(
              [
                {
                  name: "Gabriel",
                  label:
                    "Gabriel (on his prosthetic leg) standing watch over Halo and Halo's mom Angel while they nap in the shade",
                  tone: "gold",
                  scene: "lone",
                  text: "Gabriel was found wild and alone at just a few months old — injured, with no mother in sight. He needed a family, and he needed a prosthetic leg. Today he has both — enough to run, to play, and sometimes, to stand watch over the family that took him in.",
                  cta: "Read Gabriel's story",
                },
                {
                  name: "Jack-Jack",
                  label:
                    "Three donkeys standing tight together, shoulder to shoulder, desert and mountain backdrop",
                  tone: "amber",
                  scene: "herd",
                  text: "When Jack-Jack's mother died suddenly, he was only seven months old. Grief like that can be its own kind of danger for a burro — loss alone can be enough to make them stop eating. His herd was what kept him going.",
                  cta: "Read Jack-Jack's story",
                },
                {
                  name: "Xander",
                  label:
                    "Xander and his bonded mate Luna eating together from a feed bag, desert and mountain backdrop",
                  tone: "dawn",
                  scene: "pair",
                  text: "Xander was pulled from the slaughter pipeline — separated from his family at a livestock auction in Bowie, headed to Mexico. It took us a year to bring him home. Now, he's the only known father in a herd that includes two of his own sons.",
                  cta: "Read Xander's story",
                },
                {
                  name: "The Brave Herd",
                  label: "The Brave Herd resting and cuddling together under a tree",
                  tone: "dusk",
                  scene: "herd",
                  text: "When the Brave Herd arrived, they were some of the most terrified wild burros we'd ever met. We didn't force anything — we just let them learn to trust us, in their own time. Now, three generations of that family live here together — and they're some of the most affectionate, trusting donkeys on the sanctuary.",
                  cta: "Read the Brave Herd's story",
                },
              ] as const
            ).map((story, i) => (
              <div
                key={story.name}
                className={`grid md:grid-cols-2 gap-10 items-center ${
                  i % 2 === 1 ? "md:[direction:rtl]" : ""
                }`}
              >
                <Reveal className="md:[direction:ltr]">
                  <Photo label={story.label} tone={story.tone} scene={story.scene} name={story.name} />
                </Reveal>
                <Reveal delay={0.15} className="md:[direction:ltr]">
                  <h3 className="text-3xl font-semibold mb-4" style={display}>
                    {story.name}
                  </h3>
                  <p className="text-lg leading-relaxed text-[#3a3025] mb-5">{story.text}</p>
                  <Link
                    href="/donkeys"
                    className="inline-flex items-center gap-2 font-bold text-[#b5592e] hover:gap-3 transition-all"
                  >
                    {story.cta} <span aria-hidden>→</span>
                  </Link>
                </Reveal>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 8 · WHERE IT STARTED ═══ */}
      {/* Dusk — second step down the same grade. */}
      <section className="bg-gradient-to-b from-[#45331f] to-[#332517] text-[#f6f0e4] px-6 py-28">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <Kicker n="07" title="Where it started" light />
            <Reveal>
              <p className="text-2xl sm:text-3xl leading-snug font-medium mb-8" style={display}>
                "We'd already set out to start a wild burro sanctuary — rooted in
                habitat, sovereignty, and keeping bonds intact. We gave ourselves five
                years. Then Pink and Eli came along, and five years became one."
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <Link
                href="/our-story"
                className="inline-flex items-center gap-2 font-bold text-[#efc98c] hover:gap-3 transition-all"
              >
                Read our story <span aria-hidden>→</span>
              </Link>
            </Reveal>
          </div>
          <Reveal delay={0.2}>
            <Photo label="Amber and Pink napping together" name="Amber & Pink" tone="dusk" scene="pair" ratio="aspect-[4/5]" />
          </Reveal>
        </div>
      </section>

      {/* ═══ 9 · SAVE MORE FAMILIES ═══ */}
      {/* Last light before night. */}
      <section className="bg-gradient-to-b from-[#332517] to-[#241d14] text-[#f6f0e4] px-6 py-28">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <Reveal>
            <Photo label="Nose-to-nose feeding moment from the wilds" tone="dusk" scene="pair" ratio="aspect-[4/5]" />
          </Reveal>
          <div>
            <Kicker n="08" title="Save more families" light />
            <Reveal delay={0.1}>
              <p className="text-2xl sm:text-3xl leading-snug font-medium mb-8" style={display}>
                "We've seen what this way of life gives them — peace, calm, joy. More
                families deserve exactly that: land to roam, people who've earned their
                trust, the same care every family here already has."
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <Link
                href="/how-to-help"
                className="inline-flex items-center gap-2 font-bold text-[#efc98c] hover:gap-3 transition-all"
              >
                See the plan <span aria-hidden>→</span>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══ 10 · THE VISION (pinned: the pen closes, dawn breaks) ═══ */}
      <TheVision />

      {/* ═══ 11 · MAKE AN IMPACT (sunrise) ═══ */}
      <section className="bg-gradient-to-b from-[#15100b] via-[#7a4a2a] to-[#e2963f] text-[#f6f0e4] px-6 pt-24 pb-32">
        <div className="max-w-3xl mx-auto text-center">
          <Reveal>
            <Photo
              label="A rescued family standing together on open ground, backlit by morning sun, all facing the camera"
              tone="dawn"
              scene="herd"
              ratio="aspect-[21/9]"
              className="mb-14"
            />
          </Reveal>
          <Kicker n="10" title="Make an impact" light />
          <Reveal>
            <p className="text-2xl sm:text-3xl leading-snug font-medium mb-10" style={display}>
              "Everything at Donkey Dreams exists because people were inspired to give
              them a home. Give, and you're part of it — for every family already home,
              and every one still waiting."
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <Link
              href="/donate"
              className="inline-block px-10 py-4 rounded-full bg-[#241d14] text-[#f6f0e4] text-lg font-bold hover:bg-[#3a3025] transition-colors shadow-xl"
            >
              Make an Impact →
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ═══ 12 · FOOTER ═══ */}
      <StoryFooter />
    </div>
  );
}
