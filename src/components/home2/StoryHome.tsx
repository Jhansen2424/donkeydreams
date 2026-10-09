"use client";

// ── The new homepage: one day, dawn to dark ──
// A documentary-style single scroll. The page's ambient light moves through
// a desert day as you scroll (dawn → golden day → long amber → dusk → night
// at "The Vision" → sunrise again at "Make an Impact"), mirroring the copy's
// central image: Dusk and Dawn, "named for the same light at opposite ends
// of the day." Chapters fade and rise like title cards; a thin progress line
// up top reads as a film timeline.
//
// All copy is VERBATIM from the approved 10/8 doc. Photos are labeled
// placeholder frames (slow Ken Burns drift so the motion language reads even
// before real images land). CTAs route to the closest existing pages:
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
} from "motion/react";

const display = { fontFamily: "var(--font-fraunces), Georgia, serif" };

// ── Primitives ──

/** Fade-and-rise reveal when a block enters the viewport. */
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

/** Labeled placeholder frame for a photo that hasn't been exported yet.
    Gradient suggests the described light; slow Ken Burns drift sells the
    final motion language. */
function Photo({
  label,
  tone = "gold",
  ratio = "aspect-[3/2]",
  className = "",
}: {
  label: string;
  tone?: "dawn" | "gold" | "amber" | "dusk" | "night";
  ratio?: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const tones: Record<string, string> = {
    dawn: "from-[#f6e9d2] via-[#eed9b4] to-[#cfae87]",
    gold: "from-[#f0d9ae] via-[#e2963f] to-[#9a6a1f]",
    amber: "from-[#e8b57e] via-[#b5592e] to-[#6e3420]",
    dusk: "from-[#8c9bb0] via-[#4a5f7a] to-[#2b3950]",
    night: "from-[#3a4458] via-[#241d14] to-[#15100b]",
  };
  return (
    <div
      className={`relative overflow-hidden rounded-2xl ring-1 ring-white/15 ${ratio} ${className}`}
    >
      <motion.div
        className={`absolute inset-[-6%] bg-gradient-to-br ${tones[tone]}`}
        animate={reduce ? undefined : { scale: [1, 1.07], x: [0, -10] }}
        transition={{ duration: 22, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
      />
      {/* film grain */}
      <div
        className="absolute inset-0 opacity-25 mix-blend-overlay"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.14) 1px, transparent 1px)",
          backgroundSize: "3px 3px",
        }}
      />
      <div className="absolute inset-0 flex items-end p-4">
        <p className="text-[11px] leading-snug font-semibold uppercase tracking-wider text-white/85 bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2">
          Photo · {label}
        </p>
      </div>
    </div>
  );
}

/** Documentary chapter kicker: "CH. 03 · THE FAMILY CASE" with a thin rule. */
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

/** Count-up stat once it scrolls into view. */
function Stat({ value, suffix, label }: { value: number; suffix?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });
  const reduce = useReducedMotion();
  // Always start at 0 so server and client render identical text (starting
  // at `value` under reduced motion was a hydration mismatch); reduced
  // motion just skips the tween and jumps straight to the value.
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
    <div ref={ref} className="text-center">
      <p className="text-4xl sm:text-5xl font-semibold text-[#241d14]" style={display}>
        {n}
        {suffix}
      </p>
      <p className="text-sm font-medium text-[#746a5a] mt-1">{label}</p>
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
      {/* progress line is rendered by the page so it can bind scroll */}
      <div className="bg-[#f6f0e4]/80 backdrop-blur-md border-b border-[#241d14]/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link href="/new-home" className="font-bold text-[#241d14] tracking-tight" style={display}>
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
            className="shrink-0 px-4 py-2 rounded-full bg-[#b5592e] text-white text-sm font-bold hover:bg-[#a43f30] transition-colors"
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
          {[{ label: "Home", href: "/new-home" }, ...NAV].map((item) => (
            <Link key={item.label} href={item.href} className="block hover:text-white transition-colors">
              {item.label}
            </Link>
          ))}
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#b6a996] pt-4 pb-1">
            Governance
          </p>
          <p className="text-[#b6a996]">Board of Directors</p>
          <p className="text-[#b6a996]">Standard Operating Procedures</p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#b6a996] mb-3">
            Visit & Connect
          </p>
          <p>
            3900 N Stockton Hill Rd, Ste B368
            <br />
            Kingman, AZ 86432
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

  // The ambient sky: dawn cream → golden day → long amber. (The dark
  // chapters — dusk, night, sunrise — carry their own backgrounds so their
  // text contrast is exact.)
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

  return (
    <div className="text-[#241d14] antialiased">
      {/* ambient sky */}
      <motion.div className="fixed inset-0 -z-10" style={{ background: sky }} />

      {/* film-timeline progress */}
      <motion.div
        className="fixed top-0 inset-x-0 h-[3px] z-50 bg-[#b5592e] origin-left"
        style={{ scaleX: scrollYProgress }}
      />

      <StoryNav />

      {/* ═══ 1 · HERO ═══ */}
      <section className="min-h-screen flex flex-col justify-center px-6 pt-24 pb-16">
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
              ratio="aspect-[21/9]"
              className="mt-12"
            />
          </Reveal>
        </div>
      </section>

      {/* ═══ 2 · YOU ARE HERE ═══ */}
      <section className="px-6 py-24">
        <div className="max-w-5xl mx-auto space-y-28">
          <Kicker n="01" title="You are here" />
          {(
            [
              {
                label: "The wilds at sunset after a full day roaming, playing, napping",
                tone: "amber",
                text: "Roaming. Playing. Napping. And now, dinner, as the sun goes down — a full day lived entirely on their own terms.",
                flip: false,
              },
              {
                label: "Brave Herd, dusk, feeding trough",
                tone: "dusk",
                text: "They don't eat where we put them. They eat beside who they trust.",
                flip: true,
              },
              {
                label: "Dusk and Dawn, mother and daughter",
                tone: "dawn",
                text: "This is Dusk and Dawn — named for the same light at opposite ends of the day. Here, they'll grow old together. Never separated. That's the wild burro spirit, preserved.",
                flip: false,
              },
            ] as const
          ).map((beat) => (
            <div
              key={beat.label}
              className={`grid md:grid-cols-2 gap-8 items-center ${
                beat.flip ? "md:[direction:rtl]" : ""
              }`}
            >
              <Reveal className="md:[direction:ltr]">
                <Photo label={beat.label} tone={beat.tone} />
              </Reveal>
              <Reveal delay={0.2} className="md:[direction:ltr]">
                <p
                  className="text-2xl sm:text-3xl leading-snug font-medium"
                  style={display}
                >
                  {beat.text}
                </p>
              </Reveal>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ 3 · THE FAMILY CASE ═══ */}
      <section className="px-6 py-24">
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
      <section className="px-6 py-24">
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
          <div className="grid grid-cols-3 gap-6 bg-white/50 backdrop-blur rounded-2xl border border-[#241d14]/10 px-6 py-10">
            <Stat value={100} suffix="" label="Donkeys & Burros (nearly)" />
            <div className="text-center">
              <p className="text-4xl sm:text-5xl font-semibold text-[#241d14]" style={display}>
                GFAS
              </p>
              <p className="text-sm font-medium text-[#746a5a] mt-1">Accredited Sanctuary</p>
            </div>
            <Stat value={40} suffix="+" label="Mom-Child Pairs" />
          </div>
        </div>
      </section>

      {/* ═══ 5 · ROOM TO ROAM ═══ */}
      <section className="px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <Kicker n="04" title="Room to roam" />
          <div className="grid sm:grid-cols-2 gap-8">
            {(
              [
                {
                  head: "Graze",
                  label: "Sparse hillside herd, soft morning light",
                  tone: "dawn",
                  text: "No rush to breakfast at base camp. Just hanging on the ridge with friends and family, picking up a few nibbles along the way.",
                },
                {
                  head: "Run",
                  label: "Dust and motion, summer evening",
                  tone: "gold",
                  text: "Dinner, then out to run — rocky, steep ground where their bodies are designed to thrive.",
                },
                {
                  head: "Trail",
                  label: "Self-made trails across the property",
                  tone: "amber",
                  text: "Their own trails, their own loop — out across the sanctuary and back to base camp when they're ready, not when we say.",
                },
                {
                  head: "Nap",
                  label: "Moses and Nelly Belle, nose-to-tail in the shade of a tree",
                  tone: "dusk",
                  text: "Nelly Belle and Moses, a mother/son pair from the wild. Separated through adoption, reunited here — inseparable ever since.",
                },
              ] as const
            ).map((card, i) => (
              <Reveal key={card.head} delay={i * 0.1}>
                <div className="group">
                  <Photo label={card.label} tone={card.tone} />
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
      <section className="bg-gradient-to-b from-[#a43f30] to-[#7c2f23] text-[#f6f0e4] px-6 py-28">
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
            <Photo label="Amber and Dusk, nose to nose" tone="dusk" ratio="aspect-[16/9]" />
          </Reveal>
        </div>
      </section>

      {/* ═══ 7 · THEIR STORIES ═══ */}
      <section className="px-6 py-24">
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
                  text: "Gabriel was found wild and alone at just a few months old — injured, with no mother in sight. He needed a family, and he needed a prosthetic leg. Today he has both — enough to run, to play, and sometimes, to stand watch over the family that took him in.",
                  cta: "Read Gabriel's story",
                },
                {
                  name: "Jack-Jack",
                  label:
                    "Three donkeys standing tight together, shoulder to shoulder, desert and mountain backdrop",
                  tone: "amber",
                  text: "When Jack-Jack's mother died suddenly, he was only seven months old. Grief like that can be its own kind of danger for a burro — loss alone can be enough to make them stop eating. His herd was what kept him going.",
                  cta: "Read Jack-Jack's story",
                },
                {
                  name: "Xander",
                  label:
                    "Xander and his bonded mate Luna eating together from a feed bag, desert and mountain backdrop",
                  tone: "dawn",
                  text: "Xander was pulled from the slaughter pipeline — separated from his family at a livestock auction in Bowie, headed to Mexico. It took us a year to bring him home. Now, he's the only known father in a herd that includes two of his own sons.",
                  cta: "Read Xander's story",
                },
                {
                  name: "The Brave Herd",
                  label: "The Brave Herd resting and cuddling together under a tree",
                  tone: "dusk",
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
                  <Photo label={story.label} tone={story.tone} />
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
      <section className="bg-gradient-to-b from-[#4a5f7a] to-[#324257] text-[#f6f0e4] px-6 py-28">
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
            <Photo label="Amber and Pink napping together" tone="dusk" ratio="aspect-[4/5]" />
          </Reveal>
        </div>
      </section>

      {/* ═══ 9 · SAVE MORE FAMILIES ═══ */}
      <section className="bg-gradient-to-b from-[#324257] to-[#241d14] text-[#f6f0e4] px-6 py-28">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <Reveal>
            <Photo label="Nose-to-nose feeding moment from the wilds" tone="dusk" ratio="aspect-[4/5]" />
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

      {/* ═══ 10 · THE VISION (night) ═══ */}
      <section className="relative bg-[#15100b] text-[#efe8da] px-6 py-36 overflow-hidden">
        {/* starfield */}
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(1px 1px at 12% 22%, #fff8, transparent), radial-gradient(1px 1px at 38% 65%, #fff6, transparent), radial-gradient(1.5px 1.5px at 60% 18%, #fff7, transparent), radial-gradient(1px 1px at 78% 48%, #fff5, transparent), radial-gradient(1px 1px at 90% 80%, #fff6, transparent), radial-gradient(1.5px 1.5px at 25% 85%, #fff5, transparent)",
          }}
        />
        <div className="relative max-w-3xl mx-auto text-center">
          <Kicker n="09" title="The vision" light />
          <Reveal>
            <h2 className="text-4xl sm:text-6xl font-semibold leading-tight mb-10" style={display}>
              Every Wild Burro Deserves This
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-lg leading-relaxed text-[#efe8da]/85 mb-6">
              Somewhere right now, a burro is standing in a pen. Four fence lines, and
              nothing past them — no hillside, no herd, no one who knows their name.
              They were built to cover ground, to belong to someone. Now they have
              neither.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="text-2xl sm:text-3xl font-medium leading-snug mb-6" style={display}>
              Every day they stand there, a little more of the wild burro spirit goes
              quiet.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <p className="text-lg leading-relaxed text-[#efe8da]/85 mb-10">
              We believe they deserve more than survival. They deserve this: a family
              to belong to, room to roam, sovereignty honored — not someday, but as
              soon as we can build it.
            </p>
          </Reveal>
          <Reveal delay={0.4}>
            <Photo
              label="A rescued family standing together on open ground, backlit by morning sun, all facing the camera"
              tone="dawn"
              ratio="aspect-[21/9]"
              className="mb-10"
            />
          </Reveal>
          <Reveal delay={0.5}>
            <Link
              href="/donate"
              className="inline-block px-8 py-4 rounded-full bg-[#e2963f] text-[#241d14] text-lg font-bold hover:bg-[#efc98c] transition-colors"
            >
              Make an Impact →
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ═══ 11 · MAKE AN IMPACT (sunrise) ═══ */}
      <section className="bg-gradient-to-b from-[#15100b] via-[#7a4a2a] to-[#e2963f] text-[#f6f0e4] px-6 pt-28 pb-32">
        <div className="max-w-2xl mx-auto text-center">
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
