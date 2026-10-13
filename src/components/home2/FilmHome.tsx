"use client";

// ── The homepage as a film (per the 10/13 client meeting) ──
// No page scrolling. One fixed frame; scenes fade/slide in and out on a
// timer, loosely synced to the narration. A YouTube-style transport bar up
// top lets people pause, scrub, and jump chapters; the mouse wheel and
// arrow keys step scenes; press-and-hold pauses. Visuals autoplay on load
// (audio can't — browsers require a tap, so a "Tap for sound" chip arms the
// narrator). Every scene's text is server-rendered in the DOM (opacity
// does the showing/hiding), so SEO/AEO indexing sees the whole story.
//
// Branding: the OLD site's system (Open Sans 800 headings, cream / charcoal
// / sky / sand) per Josh 10/13 — the Fraunces/umber film grade is retired.
// Copy updates from the meeting: "You Are Here" cut, chapters cut, Trail
// cut, "How It Started", "Every burro removed from the wild deserves this",
// "built to cover ground" sentence cut.
//
// Photos: client-sent (public/images/film). Gabriel / Jack-Jack / Xander
// story photos + a Save More Families photo didn't survive the chat upload —
// illustrated SceneArt stands in; swap when Josh re-sends.

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Play, Pause, Volume2, VolumeX, RotateCcw, Share2 } from "lucide-react";


// ── Narration clips (existing mp3s). playbackRate 1.1 = "a touch faster". ──
const RATE = 1.1;

interface SceneDef {
  id: string;
  title: string; // scrubber tooltip
  dur: number; // seconds
  clip?: string; // narration group this scene belongs to
  clipOffset?: number; // seconds into the clip when seeking here
  render: (active: boolean) => ReactNode;
}

// ── Shared bits ──

const IMG = "/images/film";

function Bleed({
  src,
  darker,
  drift,
  children,
}: {
  src: string;
  darker?: boolean;
  /** Slow push-in on the photo while the scene holds — the frame never
      sits frozen (pass the scene's `active`). */
  drift?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className={`absolute inset-0 bg-cover bg-center ${drift ? "film-drift" : ""}`}
        style={{ backgroundImage: `url(${src})` }}
      />
      <div
        className={`absolute inset-0 ${
          darker
            ? "bg-gradient-to-t from-black/75 via-black/35 to-black/25"
            : "bg-gradient-to-t from-black/65 via-black/20 to-black/10"
        }`}
      />
      {children}
    </div>
  );
}

/** Words pour onto the page quickly, one after another. */
function Pour({
  text,
  active,
  delay = 0,
  className = "",
  // ~85ms between words reads like an actual pour; 36ms was rapid-fire
  // (client 10/13: "too fast").
  wordMs = 85,
  highlights = [],
}: {
  text: string;
  active: boolean;
  delay?: number;
  className?: string;
  wordMs?: number;
  /** Phrases that pour in big, bold, and sky — the pillar callouts
      ("highlights, bolds, and stays there" — Edj, 10/13). */
  highlights?: string[];
}) {
  const words = useMemo(() => text.split(" "), [text]);
  // Mark the word indexes covered by any highlight phrase.
  const marked = useMemo(() => {
    const flags = new Array<boolean>(words.length).fill(false);
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
    for (const phrase of highlights) {
      const pw = phrase.split(" ").map(norm);
      for (let i = 0; i <= words.length - pw.length; i++) {
        if (pw.every((p, j) => norm(words[i + j]) === p)) {
          for (let j = 0; j < pw.length; j++) flags[i + j] = true;
        }
      }
    }
    return flags;
  }, [words, highlights]);
  // The space lives OUTSIDE each animated span: inline-block spans swallow
  // their trailing whitespace, which jammed every word together (client
  // screenshot, 10/13).
  return (
    <p className={className}>
      {words.map((w, i) => (
        <span key={i}>
          <span
            className={`film-word ${marked[i] ? "font-extrabold text-sky-light text-[1.18em]" : ""}`}
            style={{
              animationDelay: active ? `${delay + i * wordMs}ms` : undefined,
              animationPlayState: active ? "running" : "paused",
              opacity: active ? undefined : 0,
            }}
          >
            {w}
          </span>{" "}
        </span>
      ))}
    </p>
  );
}

/** Movie title card: tracking-in (letters tighten as they arrive), blur
    resolve, then a slow push while the line holds. */
function TitleCard({
  active,
  delay = 0,
  className = "",
  sweep,
  children,
}: {
  active: boolean;
  delay?: number;
  className?: string;
  /** The one showpiece treatment: a warm band of light reveals the text
      left-to-right (hero title only, so it stays special). */
  sweep?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        animation: active ? `filmPush 11s linear ${delay}ms forwards` : "none",
      }}
    >
      <div
        className={`${className} ${sweep ? "film-sweep" : ""}`}
        style={{
          opacity: 0,
          animation: active
            ? `${sweep ? "filmSweepIn 2.6s" : "filmTitleIn 1.8s"} cubic-bezier(0.25,0.6,0.25,1) ${delay}ms forwards`
            : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** A timed sub-beat inside a scene: fades in at `enter` ms, optionally fades
    out at `exit` ms. Used to play paragraphs ONE AT A TIME in a compact box
    instead of reserving a huge empty panel for all of them (client 10/13:
    "this looks like shit"). */
function Beat({
  active,
  enter,
  exit,
  children,
}: {
  active: boolean;
  enter: number;
  exit?: number;
  children: ReactNode;
}) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center px-6 sm:px-10"
      style={{
        opacity: 0,
        animation: active
          ? `filmParaIn 0.7s ease ${enter}ms both${exit ? `, filmParaOut 0.9s ease ${exit}ms forwards` : ""}`
          : "none",
      }}
    >
      <div className="w-full">{children}</div>
    </div>
  );
}

function A({
  active,
  anim,
  delay = 0,
  className = "",
  children,
}: {
  active: boolean;
  anim: string; // css animation name
  delay?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`${className}`}
      style={{
        opacity: 0,
        animation: active ? `${anim} 1.1s cubic-bezier(0.2,0.6,0.2,1) ${delay}ms forwards` : "none",
      }}
    >
      {children}
    </div>
  );
}

// ── The scenes ──

const heading = "font-extrabold tracking-tight leading-tight";

function buildScenes(): SceneDef[] {
  return [
    // ═══ Cold open ═══
    {
      id: "cold1",
      title: "Opening",
      dur: 6,
      clip: "hero",
      clipOffset: 0,
      render: (a) => (
        <Bleed src={`${IMG}/pano-ridge-golden.webp`} darker drift={a}>
          <div className="absolute inset-0 flex items-center justify-center px-8">
            {/* the photo breathes alone for ~2s before the line arrives */}
            <TitleCard
              active={a}
              delay={2000}
              className={`${heading} text-3xl sm:text-5xl text-white text-center max-w-3xl`}
            >
              Somewhere in the Arizona desert…
            </TitleCard>
          </div>
        </Bleed>
      ),
    },
    {
      id: "cold2",
      title: "Opening",
      dur: 6,
      clip: "hero",
      clipOffset: 6,
      render: (a) => (
        <Bleed src={`${IMG}/pano-herd-rocks.webp`} darker drift={a}>
          <div className="absolute inset-0 flex items-center justify-center px-8">
            <TitleCard
              active={a}
              delay={1200}
              className={`${heading} text-3xl sm:text-5xl text-white text-center max-w-4xl`}
            >
              …there's a place where wild burro families never have to say goodbye.
            </TitleCard>
          </div>
        </Bleed>
      ),
    },
    // ═══ Hero ═══
    {
      id: "hero",
      title: "Preserving the Wild Burro Spirit",
      dur: 8,
      clip: "hero",
      clipOffset: 11,
      render: (a) => (
        <Bleed src={`${IMG}/pano-sunset-trough.webp`} drift={a}>
          <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
            {/* the showpiece: first light sweeps the title into view */}
            <TitleCard
              active={a}
              delay={600}
              sweep
              className={`${heading} text-4xl sm:text-6xl lg:text-7xl text-white max-w-5xl [text-shadow:0_0_36px_rgba(255,180,90,0.3)]`}
            >
              <h1>Preserving the Wild Burro Spirit</h1>
            </TitleCard>
            <A active={a} anim="filmFadeUp" delay={2900}>
              <p className="text-lg sm:text-2xl text-white/90 max-w-2xl mt-6 leading-relaxed">
                We give entire wild burro families a forever home — together, with room
                to roam, and the freedom to still be who they are.
              </p>
            </A>
          </div>
        </Bleed>
      ),
    },
    // ═══ The family case ═══
    {
      id: "wildfree",
      title: "Wild and Free Today",
      dur: 7,
      clip: "familycase",
      clipOffset: 0,
      render: (a) => (
        <div className="absolute inset-0 bg-cream flex flex-col items-center justify-center px-8 text-center gap-6">
          <A active={a} anim="filmComeAt" delay={400}>
            <h2 className={`${heading} text-4xl sm:text-6xl lg:text-7xl text-charcoal`}>
              Wild and Free Today.
            </h2>
          </A>
          <A active={a} anim="filmRetreat" delay={3200}>
            <h2 className={`${heading} text-4xl sm:text-6xl lg:text-7xl text-warm-gray`}>
              Alone Tomorrow.
            </h2>
          </A>
        </div>
      ),
    },
    {
      id: "familybody",
      title: "Wild and Free Today",
      dur: 31,
      clip: "familycase",
      clipOffset: 7,
      render: (a) => (
        <Bleed src={`${IMG}/pano-sunset-graze.webp`} darker>
          <div className="absolute inset-0 flex items-center justify-center px-5 sm:px-10 pt-24">
            {/* one paragraph at a time: pour in → hold → fade → next */}
            <div className="relative w-full max-w-3xl h-[min(52svh,440px)] bg-black/45 backdrop-blur-sm rounded-2xl">
              <Beat active={a} enter={800} exit={11300}>
                <Pour
                  active={a}
                  delay={1300}
                  text="In the wild, a burro's life revolves around family — a mother close by, a sibling, a herd they've known for years, grazing together, moving together, watching out for one another. Freedom, for a burro, means family — and it's not just behavior. A burro's limbic system — the part of the brain that governs emotion, memory, and bonding — works the same way ours does. They don't just form those bonds; they feel them, the same way we feel love, and the same way we feel it when we lose someone we love. Those bonds are real, and they run deep."
                  className="text-sm sm:text-lg lg:text-xl text-white/95 leading-relaxed"
                />
              </Beat>
              <Beat active={a} enter={12400} exit={21900}>
                <Pour
                  active={a}
                  delay={12900}
                  text="When they're removed from the wild, that changes in an instant. One moment they're part of a herd that's never been apart. The next, they're alone — family scattered, a new world that looks nothing like the one they knew. Too often, what comes next isn't a wild burro habitat at all. It's a pen. A corral. The same four fence lines, every day, for the rest of their lives — with no family left to stand beside. They don't just lose their freedom. They carry what they lost."
                  className="text-sm sm:text-lg lg:text-xl text-white/95 leading-relaxed"
                />
              </Beat>
              <Beat active={a} enter={23000}>
                <Pour
                  active={a}
                  delay={23500}
                  text="That's the gap Donkey Dreams exists to close — a place where burros removed from the wild can live out their lives with family intact, in a wild burro habitat catering to who they are, on their own terms."
                  className="text-base sm:text-xl lg:text-2xl font-semibold text-white leading-relaxed text-center"
                />
              </Beat>
            </div>
          </div>
        </Bleed>
      ),
    },
    // ═══ Our promise ═══
    {
      id: "savingtitle",
      title: "Our Promise",
      dur: 5,
      clip: "promise",
      clipOffset: 0,
      render: (a) => (
        <div className="absolute inset-0 bg-cream flex flex-col items-center justify-center px-8 text-center gap-5">
          <A active={a} anim="filmComeAt" delay={300}>
            <h2 className={`${heading} text-4xl sm:text-6xl text-charcoal`}>
              Saving Them Together,
            </h2>
          </A>
          <A active={a} anim="filmComeAt" delay={1800}>
            <h2 className={`${heading} text-4xl sm:text-6xl text-sky-dark`}>
              Not One at a Time.
            </h2>
          </A>
        </div>
      ),
    },
    {
      id: "promisebody",
      title: "Our Promise",
      dur: 22,
      clip: "promise",
      clipOffset: 5,
      render: (a) => (
        <Bleed src={`${IMG}/pano-white-donkeys.webp`} darker>
          <div className="absolute inset-0 flex flex-col items-center justify-center px-5 sm:px-10 pt-24 gap-6">
            {/* one paragraph at a time; pillar phrases pour in big, bold, sky */}
            <div className="relative w-full max-w-3xl h-[min(40svh,330px)] bg-black/45 backdrop-blur-sm rounded-2xl">
              <Beat active={a} enter={500} exit={9300}>
                <Pour
                  active={a}
                  delay={1000}
                  highlights={["families whole", "room to roam", "sovereignty honored"]}
                  text="At Donkey Dreams, burros removed from the wild get back the life they once had. We believe that takes three things: keeping their families whole, because a burro without their herd isn't complete. A wild burro habitat, with room to roam the way they once did. And their sovereignty honored — their right to still be who they are, even in our care."
                  className="text-sm sm:text-lg lg:text-xl text-white/95 leading-relaxed"
                />
              </Beat>
              <Beat active={a} enter={10300}>
                <Pour
                  active={a}
                  delay={10800}
                  text="Nearly 100 donkeys and wild burros live at Donkey Dreams today. Most arrived as family; some arrived alone and found one here — either way, no one goes it alone. As long as burros are being removed from the wild, we'll keep finding room for as many families as we can."
                  className="text-sm sm:text-lg lg:text-xl text-white/95 leading-relaxed"
                />
              </Beat>
            </div>
            {/* the three pillars: big, bold, hold */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 items-center">
              {["Families whole.", "Room to roam.", "Sovereignty honored."].map((p, i) => (
                <A key={p} active={a} anim="filmGrowHold" delay={15500 + i * 1800}>
                  <p className={`${heading} text-2xl sm:text-4xl text-sky-light [text-shadow:0_2px_16px_rgba(0,0,0,0.6)]`}>
                    {p}
                  </p>
                </A>
              ))}
            </div>
          </div>
        </Bleed>
      ),
    },
    // ═══ Room to roam ═══
    {
      id: "roamheader",
      title: "Room to Roam",
      dur: 3,
      clip: "roam",
      clipOffset: 0,
      render: (a) => (
        <div className="absolute inset-0 bg-charcoal flex items-center justify-center overflow-hidden">
          <A active={a} anim="filmSlideAcross" delay={150}>
            <h2 className={`${heading} text-5xl sm:text-7xl text-white`}>Room to Roam</h2>
          </A>
        </div>
      ),
    },
    {
      id: "graze",
      title: "Room to Roam — Graze",
      dur: 8,
      clip: "roam",
      clipOffset: 3,
      render: (a) => (
        <Bleed src={`${IMG}/pano-ridge-golden.webp`}>
          <div className="absolute inset-0 flex flex-col justify-end items-start p-8 sm:p-14">
            <A active={a} anim="filmFadeUp" delay={300}>
              <h3 className={`${heading} text-4xl sm:text-6xl text-white`}>Graze</h3>
            </A>
            <A active={a} anim="filmFadeUp" delay={1400}>
              <p className="text-white/85 text-base sm:text-lg max-w-xl mt-3">
                No rush to breakfast at base camp. Just hanging on the ridge with friends
                and family, picking up a few nibbles along the way.
              </p>
            </A>
          </div>
        </Bleed>
      ),
    },
    {
      id: "run",
      title: "Room to Roam — Run",
      dur: 7,
      clip: "roam",
      clipOffset: 11,
      render: (a) => (
        <Bleed src={`${IMG}/pano-herd-rocks.webp`}>
          <div className="absolute inset-0 flex flex-col justify-end items-start p-8 sm:p-14">
            <A active={a} anim="filmFadeUp" delay={300}>
              <h3 className={`${heading} text-4xl sm:text-6xl text-white`}>Run</h3>
            </A>
            <A active={a} anim="filmFadeUp" delay={1400}>
              <p className="text-white/85 text-base sm:text-lg max-w-xl mt-3">
                Dinner, then out to run — rocky, steep ground where their bodies are
                designed to thrive.
              </p>
            </A>
          </div>
        </Bleed>
      ),
    },
    {
      id: "nap",
      title: "Room to Roam — Nap",
      dur: 8,
      clip: "roam",
      clipOffset: 18,
      render: (a) => (
        <Bleed src={`${IMG}/story-brave-herd.webp`}>
          <div className="absolute inset-0 flex flex-col justify-end items-start p-8 sm:p-14">
            <A active={a} anim="filmFadeUp" delay={300}>
              <h3 className={`${heading} text-4xl sm:text-6xl text-white`}>Nap</h3>
            </A>
            <A active={a} anim="filmFadeUp" delay={1400}>
              <p className="text-white/85 text-base sm:text-lg max-w-xl mt-3">
                Shade, family, and nowhere they have to be. Reunited pairs rest
                nose-to-tail — inseparable ever since.
              </p>
            </A>
          </div>
        </Bleed>
      ),
    },
    // ═══ Trust, not control ═══
    {
      id: "trust",
      title: "Trust, Not Control",
      dur: 16,
      clip: "trust",
      clipOffset: 0,
      render: (a) => (
        <div className="absolute inset-0">
          <Bleed src={`${IMG}/section-6-trust-amber-dusk.webp`} darker />
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${IMG}/pano-white-donkeys.webp)`,
              opacity: 0,
              animation: a ? "filmCrossfade 4s ease 9s forwards" : "none",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/20" />
          <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-14 max-w-4xl">
            <A active={a} anim="filmSlideAcross" delay={200}>
              <h2 className={`${heading} text-4xl sm:text-6xl text-white mb-6`}>
                Trust, Not Control
              </h2>
            </A>
            <div className="space-y-3 max-w-2xl">
              <Pour
                active={a}
                delay={1600}
                wordMs={55}
                text="In the wild, a burro decides how to spend their day. Where to graze. When to rest. Who to stand beside. We don't take that away just because they need care. Sovereignty, to us, means they get a say — that their needs carry the same weight as ours, the sanctuary's, anyone's. They aren't something we manage. They're someone we listen to."
                className="text-sm sm:text-base lg:text-lg text-white/95 leading-relaxed [text-shadow:0_1px_10px_rgba(0,0,0,0.7)]"
              />
              <Pour
                active={a}
                delay={6800}
                wordMs={55}
                text="When a donkey needs treatment — a sore hoof, medicine, a watchful eye on a healing wound — our caretakers go to them, wherever they are, instead of pulling them away from their family and freedom to make it easier on us. We don't run them in herds to get it done, and we don't chase them to make it quicker — many of them were already chased once, the day they left the wild, and we won't ask them to relive that just to make a checkup easier on us."
                className="text-sm sm:text-base lg:text-lg text-white/95 leading-relaxed [text-shadow:0_1px_10px_rgba(0,0,0,0.7)]"
              />
              <Pour
                active={a}
                delay={13000}
                wordMs={55}
                text="To be clear: every donkey gets the care they need, fully. What's different is how we get there."
                className="text-sm sm:text-base lg:text-lg font-semibold text-white leading-relaxed [text-shadow:0_1px_10px_rgba(0,0,0,0.7)]"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "sovereignty",
      title: "Sovereignty",
      dur: 6.5,
      clip: "trust",
      clipOffset: 16,
      render: (a) => (
        <div className="absolute inset-0 bg-charcoal flex items-center justify-center px-8">
          <A active={a} anim="filmComeAt" delay={300}>
            <p className={`${heading} text-2xl sm:text-4xl lg:text-5xl text-white text-center max-w-4xl leading-snug`}>
              We call it <span className="text-sky-light">sovereignty</span>: their right
              to still be who they are — not managed, not overridden, but met as an
              equal — even while we're taking care of them.
            </p>
          </A>
        </div>
      ),
    },
    // ═══ Their stories (held frame) ═══
    {
      id: "storiesheader",
      title: "Their Stories",
      dur: 3.5,
      clip: "stories",
      clipOffset: 0,
      render: (a) => (
        <div className="absolute inset-0 bg-cream flex items-center justify-center px-8">
          <A active={a} anim="filmComeAt" delay={200}>
            <h2 className={`${heading} text-3xl sm:text-5xl lg:text-6xl text-charcoal text-center max-w-4xl`}>
              Every Burro, Every Family Has a Story
            </h2>
          </A>
        </div>
      ),
    },
    // One slide: the four story cards animate in one by one — and STAY —
    // timed to the narrator introducing each donkey (Josh, 10/13: "brave
    // herd should animate in, then it stays, and another one animates in").
    {
      id: "storiesgrid",
      title: "Their Stories",
      dur: 26,
      clip: "stories",
      clipOffset: 3.5,
      render: (a) => {
        const CARDS = [
          {
            name: "Gabriel",
            at: 500,
            img: `${IMG}/story-gabriel.webp`,
            text: "Found wild and alone at a few months old — injured, no mother in sight. He needed a family and a prosthetic leg. Today he has both — enough to run, to play, and to stand watch over the family that took him in.",
          },
          {
            name: "Jack-Jack",
            at: 7000,
            img: `${IMG}/story-jackjack.webp`,
            text: "When Jack-Jack's mother died suddenly, he was only seven months old. Grief like that can be its own kind of danger for a burro. His herd was what kept him going.",
          },
          {
            name: "Xander",
            at: 13500,
            img: `${IMG}/story-xander.webp`,
            text: "Pulled from the slaughter pipeline at a livestock auction. It took us a year to bring him home. Now he's the only known father in a herd that includes two of his own sons.",
          },
          {
            name: "The Brave Herd",
            at: 20000,
            img: `${IMG}/story-brave-herd.webp`,
            text: "Some of the most terrified wild burros we'd ever met. We let them learn to trust us in their own time. Now three generations of that family live here together.",
          },
        ];
        return (
          <div className="absolute inset-0 bg-cream-dark flex items-center justify-center px-4 sm:px-10 pt-28 pb-6 overflow-hidden">
            <div className="max-w-5xl w-full grid grid-cols-2 gap-3 sm:gap-6">
              {CARDS.map((c, i) => (
                <A
                  key={c.name}
                  active={a}
                  anim={i % 2 === 0 ? "filmFromLeft" : "filmFromRight"}
                  delay={c.at}
                  className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden"
                >
                  <div
                    className="h-[14svh] sm:h-[20svh] bg-cover bg-center"
                    style={{ backgroundImage: `url(${c.img})` }}
                  />
                  <div className="p-3 sm:p-4">
                    <h3 className={`${heading} text-base sm:text-xl text-charcoal mb-1`}>
                      {c.name}
                    </h3>
                    <p className="text-[11px] sm:text-sm text-warm-gray leading-snug line-clamp-3 sm:line-clamp-4">
                      {c.text}
                    </p>
                  </div>
                </A>
              ))}
            </div>
          </div>
        );
      },
    },
    // ═══ How it started ═══
    {
      id: "howstarted",
      title: "How It Started",
      dur: 9,
      render: (a) => (
        <div className="absolute inset-0 bg-cream flex items-center px-5 sm:px-12 overflow-hidden">
          <div className="max-w-5xl mx-auto w-full grid md:grid-cols-2 gap-6 md:gap-10 items-center">
            <A active={a} anim="filmFromLeft" delay={200}>
              <h2 className={`${heading} text-3xl sm:text-5xl text-charcoal mb-5`}>
                How It Started
              </h2>
              <p className="text-base sm:text-xl text-warm-gray leading-relaxed">
                "We'd already set out to start a wild burro sanctuary — rooted in habitat,
                sovereignty, and keeping bonds intact. We gave ourselves five years. Then
                Pink and Eli came along, and five years became one."
              </p>
            </A>
            <A active={a} anim="filmFromRight" delay={200}>
              <div
                className="aspect-[4/3] rounded-2xl bg-cover bg-center shadow-xl"
                style={{ backgroundImage: `url(${IMG}/section-8-how-it-started.webp)` }}
              />
            </A>
          </div>
        </div>
      ),
    },
    // ═══ Save more families ═══
    {
      id: "savemore",
      title: "Save More Families",
      dur: 9,
      render: (a) => (
        <div className="absolute inset-0 bg-cream-dark flex items-center px-5 sm:px-12 overflow-hidden">
          <div className="max-w-5xl mx-auto w-full grid md:grid-cols-2 gap-6 md:gap-10 items-center">
            <A active={a} anim="filmFromLeft" delay={200}>
              <div
                className="aspect-[4/3] rounded-2xl bg-cover bg-center shadow-xl"
                style={{ backgroundImage: `url(${IMG}/section-9-savemore.webp)` }}
              />
            </A>
            <A active={a} anim="filmFromRight" delay={200}>
              <h2 className={`${heading} text-3xl sm:text-5xl text-charcoal mb-5`}>
                Save More Families
              </h2>
              <p className="text-base sm:text-xl text-warm-gray leading-relaxed">
                "We've seen what this way of life gives them — peace, calm, joy. More
                families deserve exactly that: land to roam, people who've earned their
                trust, the same care every family here already has."
              </p>
            </A>
          </div>
        </div>
      ),
    },
    // ═══ The vision (timed beats) ═══
    {
      id: "visiontitle",
      title: "The Vision",
      dur: 5.5,
      clip: "vision",
      clipOffset: 0,
      render: (a) => (
        <div className="absolute inset-0 bg-charcoal flex items-center justify-center px-8">
          <A active={a} anim="filmComeAt" delay={300}>
            <h2 className={`${heading} text-3xl sm:text-5xl lg:text-6xl text-white text-center max-w-4xl`}>
              Every burro removed from the wild deserves this.
            </h2>
          </A>
        </div>
      ),
    },
    {
      id: "visionpen",
      title: "The Vision",
      dur: 9,
      clip: "vision",
      clipOffset: 5.5,
      render: (a) => (
        <div className="absolute inset-0 bg-charcoal flex items-center justify-center px-8">
          <A active={a} anim="filmFadeUp" delay={400}>
            <p className="text-lg sm:text-2xl text-white/90 text-center max-w-3xl leading-relaxed">
              Somewhere right now, a burro is standing in a pen. Four fence lines, and
              nothing past them — no hillside, no herd, no one who knows their name.
            </p>
          </A>
        </div>
      ),
    },
    {
      id: "visionquiet",
      title: "The Vision",
      dur: 7,
      clip: "vision",
      clipOffset: 14.5,
      render: (a) => (
        <div className="absolute inset-0 bg-black flex items-center justify-center px-8">
          <A active={a} anim="filmComeAt" delay={400}>
            <p className={`${heading} text-2xl sm:text-4xl lg:text-5xl text-white text-center max-w-4xl leading-snug`}>
              Every day they stand there, a little more of the wild burro spirit goes
              quiet.
            </p>
          </A>
        </div>
      ),
    },
    {
      id: "visiondeserve",
      title: "The Vision",
      dur: 10,
      clip: "vision",
      clipOffset: 21.5,
      render: (a) => (
        <div className="absolute inset-0 bg-charcoal flex flex-col items-center justify-center px-8 gap-7">
          <A active={a} anim="filmFadeUp" delay={300}>
            <p className="text-lg sm:text-2xl text-white/90 text-center max-w-3xl">
              We believe they deserve more than survival. They deserve this:
            </p>
          </A>
          <div className="flex flex-col items-center gap-4">
            {["A family to belong to.", "Room to roam.", "Sovereignty honored."].map((p, i) => (
              <A key={p} active={a} anim="filmGrowHold" delay={2200 + i * 2200}>
                <p className={`${heading} text-2xl sm:text-4xl text-sky-light text-center`}>{p}</p>
              </A>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "visionbuild",
      title: "The Vision",
      dur: 9.5,
      clip: "vision",
      clipOffset: 31.5,
      render: (a) => (
        <div className="absolute inset-0 bg-charcoal flex flex-col items-center justify-center px-8 gap-6 overflow-hidden">
          <A active={a} anim="filmFadeUp" delay={300}>
            <p className={`${heading} text-3xl sm:text-5xl text-white/85`}>Not someday —</p>
          </A>
          <div
            style={{
              opacity: 0,
              animation: a ? "filmExpand 6.5s cubic-bezier(0.2,0.6,0.2,1) 2200ms forwards" : "none",
            }}
          >
            <p className={`${heading} text-3xl sm:text-5xl lg:text-6xl text-sky-light text-center`}>
              but as soon as we can build it.
            </p>
          </div>
        </div>
      ),
    },
    // ═══ Make an impact ═══
    {
      id: "impact",
      title: "Make an Impact",
      dur: 10,
      render: (a) => (
        <Bleed src={`${IMG}/section-10-vision.webp`} darker>
          <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
            <A active={a} anim="filmComeAt" delay={400}>
              <h2 className={`${heading} text-4xl sm:text-6xl text-white mb-6`}>
                Make an Impact
              </h2>
            </A>
            <A active={a} anim="filmFadeUp" delay={1400}>
              <p className="text-lg sm:text-2xl text-white/90 max-w-2xl leading-relaxed mb-8">
                Everything at Donkey Dreams exists because people were inspired to give
                them a home. Give, and you're part of it — for every family already home,
                and every one still waiting.
              </p>
            </A>
            <A active={a} anim="filmFadeUp" delay={2300}>
              <Link
                href="/donate"
                className="inline-block px-10 py-4 rounded-full bg-sky text-charcoal text-lg font-extrabold hover:bg-sky-light transition-colors shadow-2xl"
              >
                Donate Now →
              </Link>
            </A>
          </div>
        </Bleed>
      ),
    },
    // ═══ End screen: explore more ═══
    {
      id: "end",
      title: "Explore More",
      dur: Infinity,
      render: (a) => <EndScreen active={a} />,
    },
  ];
}

function EndScreen({ active }: { active: boolean }) {
  const [copied, setCopied] = useState(false);
  const cards = [
    { label: "Our Story", href: "/our-story", img: `${IMG}/section-8-how-it-started.webp` },
    { label: "Their Stories", href: "/donkeys", img: `${IMG}/story-brave-herd.webp` },
    { label: "Save More Families", href: "/how-to-help", img: `${IMG}/pano-white-donkeys.webp` },
    { label: "Make an Impact", href: "/donate", img: `${IMG}/section-10-vision.webp` },
  ];
  const share = async () => {
    const data = { title: "Donkey Dreams Sanctuary", text: "Watch their story.", url: "https://donkeydreams.org" };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(data.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
  };
  return (
    <div className="absolute inset-0 bg-cream flex flex-col items-center justify-center px-5 py-10 overflow-y-auto">
      <A active={active} anim="filmFadeUp" delay={200}>
        <h2 className={`${heading} text-3xl sm:text-5xl text-charcoal text-center mb-8`}>
          Explore More
        </h2>
      </A>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl w-full mb-8">
        {cards.map((c, i) => (
          <A key={c.label} active={active} anim="filmFadeUp" delay={500 + i * 250}>
            <Link href={c.href} className="group block">
              <div
                className="aspect-[4/5] rounded-xl bg-cover bg-center shadow-md group-hover:shadow-xl group-hover:scale-[1.02] transition-all"
                style={{ backgroundImage: `url(${c.img})` }}
              />
              <p className="text-sm sm:text-base font-bold text-charcoal mt-2 text-center group-hover:text-sky-dark transition-colors">
                {c.label}
              </p>
            </Link>
          </A>
        ))}
      </div>
      <A active={active} anim="filmFadeUp" delay={1600} className="flex flex-wrap justify-center gap-3 mb-8">
        <button
          onClick={() => window.dispatchEvent(new Event("dd:film-restart"))}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-charcoal text-white text-sm font-bold hover:bg-warm-gray transition-colors"
        >
          <RotateCcw className="w-4 h-4" /> Watch again
        </button>
        <button
          onClick={share}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-sky text-charcoal text-sm font-bold hover:bg-sky-light transition-colors"
        >
          <Share2 className="w-4 h-4" /> {copied ? "Link copied!" : "Share this story"}
        </button>
      </A>
      <A active={active} anim="filmFadeUp" delay={1900}>
        <div className="text-center text-xs text-warm-gray space-y-1">
          <p className="flex justify-center gap-4 font-semibold">
            {["Instagram", "Facebook", "YouTube", "TikTok"].map((s) => (
              <span key={s} className="hover:text-charcoal cursor-pointer">{s}</span>
            ))}
          </p>
          <p>Donkey Dreams Sanctuary · A GFAS-Accredited 501(c)(3) Nonprofit · EIN 81-3650509</p>
          <p>3900 N Stockton Hill Rd, Ste B368, Kingman, AZ 86432 · amber@donkeydreams.org</p>
          <p>© 2026 Donkey Dreams Sanctuary. All rights reserved.</p>
        </div>
      </A>
    </div>
  );
}

// ── The player ──

const NAV = [
  { label: "Our Story", href: "/our-story" },
  { label: "Hear Their Stories", href: "/donkeys" },
  { label: "Save More Families", href: "/how-to-help" },
  { label: "Make an Impact", href: "/donate" },
];

export default function FilmHome() {
  const scenes = useMemo(buildScenes, []);
  const total = useMemo(
    () => scenes.reduce((s, sc) => s + (Number.isFinite(sc.dur) ? sc.dur : 0), 0),
    [scenes]
  );
  const starts = useMemo(() => {
    let acc = 0;
    return scenes.map((sc) => {
      const v = acc;
      acc += Number.isFinite(sc.dur) ? sc.dur : 0;
      return v;
    });
  }, [scenes]);

  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [soundOn, setSoundOn] = useState(false);
  const [progress, setProgress] = useState(0); // seconds into the film
  const [hoverTip, setHoverTip] = useState<{ x: number; label: string } | null>(null);

  const idxRef = useRef(0);
  const playingRef = useRef(true);
  const soundRef = useRef(false);
  const elapsedRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentClipRef = useRef<string | null>(null);
  idxRef.current = idx;
  playingRef.current = playing;
  soundRef.current = soundOn;

  const startClipFor = useCallback(
    (i: number, intoScene = 0) => {
      const sc = scenes[i];
      const audio = audioRef.current;
      if (!audio) return;
      if (!sc.clip || !soundRef.current) {
        audio.pause();
        currentClipRef.current = sc.clip ?? null;
        return;
      }
      const offset = (sc.clipOffset ?? 0) + intoScene;
      if (currentClipRef.current === sc.clip && !audio.paused) return; // clip continues across scenes
      currentClipRef.current = sc.clip;
      audio.src = `/audio/story/${sc.clip}.mp3`;
      audio.playbackRate = RATE;
      audio.currentTime = offset;
      void audio.play().catch(() => {});
    },
    [scenes]
  );

  const seek = useCallback(
    (i: number) => {
      const clamped = Math.max(0, Math.min(scenes.length - 1, i));
      elapsedRef.current = 0;
      idxRef.current = clamped; // immediate, so rapid key presses stack correctly
      setIdx(clamped);
      setProgress(starts[clamped]);
      currentClipRef.current = null; // force clip restart at the right offset
      audioRef.current?.pause();
      startClipFor(clamped);
    },
    [scenes.length, starts, startClipFor]
  );

  // Master clock. A timer, not requestAnimationFrame: rAF freezes whenever
  // the tab isn't being drawn (background/occluded windows), which would
  // stall the film unpredictably. The visibility guard keeps the movie
  // politely paused while the tab is actually hidden.
  useEffect(() => {
    let last = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      const dt = Math.min(0.5, (now - last) / 1000);
      last = now;
      if (!playingRef.current || document.hidden) return;
      const sc = scenes[idxRef.current];
      elapsedRef.current += dt;
      setProgress(starts[idxRef.current] + Math.min(elapsedRef.current, Number.isFinite(sc.dur) ? sc.dur : 0));
      if (Number.isFinite(sc.dur) && elapsedRef.current >= sc.dur) {
        const next = idxRef.current + 1;
        if (next < scenes.length) {
          elapsedRef.current = 0;
          setIdx(next);
          startClipFor(next);
        }
      }
    }, 150);
    return () => clearInterval(timer);
  }, [scenes, starts, startClipFor]);

  // audio element
  useEffect(() => {
    const audio = new Audio();
    audio.volume = 0.9;
    audio.playbackRate = RATE;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  // transport inputs: wheel steps scenes, keys, restart event
  useEffect(() => {
    let lastWheel = 0;
    const onWheel = (e: WheelEvent) => {
      const now = Date.now();
      if (now - lastWheel < 700) return;
      lastWheel = now;
      if (e.deltaY > 10) seek(idxRef.current + 1);
      else if (e.deltaY < -10) seek(idxRef.current - 1);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => {
          if (p) audioRef.current?.pause();
          else if (soundRef.current) void audioRef.current?.play().catch(() => {});
          return !p;
        });
      } else if (e.key === "ArrowRight") seek(idxRef.current + 1);
      else if (e.key === "ArrowLeft") seek(idxRef.current - 1);
    };
    const onRestart = () => seek(0);
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("dd:film-restart", onRestart);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("dd:film-restart", onRestart);
    };
  }, [seek]);

  // press-and-hold on the stage pauses; release resumes
  const holdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heldRef = useRef(false);
  const onStageDown = () => {
    holdRef.current = setTimeout(() => {
      heldRef.current = true;
      setPlaying(false);
      audioRef.current?.pause();
    }, 300);
  };
  const onStageUp = () => {
    if (holdRef.current) clearTimeout(holdRef.current);
    if (heldRef.current) {
      heldRef.current = false;
      setPlaying(true);
      if (soundRef.current) void audioRef.current?.play().catch(() => {});
    }
  };

  const togglePlay = () => {
    setPlaying((p) => {
      if (p) audioRef.current?.pause();
      else if (soundRef.current) void audioRef.current?.play().catch(() => {});
      return !p;
    });
  };

  const enableSound = () => {
    // inside the tap: start the current scene's clip at the right offset
    soundRef.current = true;
    setSoundOn(true);
    currentClipRef.current = null;
    startClipFor(idxRef.current, elapsedRef.current);
    if (!playingRef.current) audioRef.current?.pause();
  };

  const disableSound = () => {
    soundRef.current = false;
    setSoundOn(false);
    audioRef.current?.pause();
  };

  const onScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    const target = frac * total;
    let i = 0;
    while (i < scenes.length - 1 && starts[i + 1] <= target) i++;
    seek(i);
  };

  const onScrubHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    const target = frac * total;
    let i = 0;
    while (i < scenes.length - 1 && starts[i + 1] <= target) i++;
    setHoverTip({ x: e.clientX - r.left, label: scenes[i].title });
  };

  return (
    <div className="fixed inset-0 bg-cream text-charcoal overflow-hidden select-none">
      {/* keyframes for the scene animations */}
      <style>{`
        @keyframes filmFadeUp { from { opacity: 0; transform: translateY(26px); } to { opacity: 1; transform: none; } }
        @keyframes filmComeAt { from { opacity: 0; transform: scale(0.65); } to { opacity: 1; transform: scale(1); } }
        @keyframes filmRetreat { 0% { opacity: 0; transform: scale(1.25); } 45% { opacity: 1; transform: scale(1); } 100% { opacity: 0.55; transform: scale(0.82); } }
        @keyframes filmGrowHold { from { opacity: 0; transform: scale(0.6); } to { opacity: 1; transform: scale(1); } }
        @keyframes filmSlideAcross { from { opacity: 0; transform: translateX(-60vw); } to { opacity: 1; transform: none; } }
        @keyframes filmFromLeft { from { opacity: 0; transform: translateX(-80px); } to { opacity: 1; transform: none; } }
        @keyframes filmFromRight { from { opacity: 0; transform: translateX(80px); } to { opacity: 1; transform: none; } }
        @keyframes filmExpand { 0% { opacity: 0; transform: scale(0.7); } 25% { opacity: 1; transform: scale(1); } 100% { opacity: 1; transform: scale(1.35); } }
        @keyframes filmCrossfade { to { opacity: 1; } }
        @keyframes filmParaIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes filmParaOut { from { opacity: 1; } to { opacity: 0; } }
        /* movie title cards */
        @keyframes filmTitleIn {
          0% { opacity: 0; letter-spacing: 0.22em; filter: blur(9px); }
          100% { opacity: 1; letter-spacing: 0.01em; filter: blur(0); }
        }
        @keyframes filmPush { from { transform: scale(1); } to { transform: scale(1.05); } }
        @keyframes filmDrift { from { transform: scale(1); } to { transform: scale(1.08); } }
        .film-drift { animation: filmDrift 18s linear forwards; }
        /* first-light sweep: a soft-edged mask slides across, revealing the
           title left to right like dawn raking the desert */
        .film-sweep {
          -webkit-mask-image: linear-gradient(100deg, #000 35%, transparent 55%);
          mask-image: linear-gradient(100deg, #000 35%, transparent 55%);
          -webkit-mask-size: 300% 100%;
          mask-size: 300% 100%;
        }
        @keyframes filmSweepIn {
          0% { opacity: 1; -webkit-mask-position: 120% 0; mask-position: 120% 0; }
          100% { opacity: 1; -webkit-mask-position: 0% 0; mask-position: 0% 0; }
        }
        /* "Liquid pour": words fall in from just above, soft like liquid,
           then settle sharp — overlapping into a continuous cascade
           (client 10/13: "almost like it's being poured onto the page"). */
        @keyframes filmWordIn {
          0% { opacity: 0; transform: translateY(-0.9em) scale(0.94, 1.28); filter: blur(10px); }
          45% { opacity: 1; filter: blur(3px); }
          75% { transform: translateY(0.07em) scale(1.03, 0.97); filter: blur(0.5px); }
          100% { opacity: 1; transform: none; filter: blur(0); }
        }
        .film-word { opacity: 0; display: inline-block; animation: filmWordIn 0.95s cubic-bezier(0.3,0.6,0.25,1) forwards; animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          .film-word, [style*="filmFadeUp"], [style*="filmComeAt"] { animation-duration: 0.01s !important; }
        }
      `}</style>

      {/* ── stage ── */}
      <div
        className="absolute inset-0"
        onPointerDown={onStageDown}
        onPointerUp={onStageUp}
        onPointerCancel={onStageUp}
      >
        {scenes.map((sc, i) => (
          <div
            key={sc.id}
            aria-hidden={i !== idx}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{ opacity: i === idx ? 1 : 0, pointerEvents: i === idx ? "auto" : "none", zIndex: i === idx ? 1 : 0 }}
          >
            {sc.render(i === idx)}
          </div>
        ))}

        {/* persistent section titles — quiet documentary supers, anchored
            top-left with a short sky underline (the big floating center
            heading read as "weird" — client 10/13). Chapters stay gone. */}
        {(() => {
          const SUPERS: Record<string, { label: string; dark?: boolean }> = {
            familybody: { label: "Wild and Free Today. Alone Tomorrow." },
            promisebody: { label: "Saving Them Together, Not One at a Time." },
            graze: { label: "Room to Roam" },
            run: { label: "Room to Roam" },
            nap: { label: "Room to Roam" },
            storiesgrid: { label: "Every Burro, Every Family Has a Story", dark: true },
          };
          const sup = SUPERS[scenes[idx].id];
          if (!sup) return null;
          return (
            <div
              key={sup.label}
              className="absolute top-[106px] left-6 sm:left-12 z-10 pointer-events-none"
              style={{ animation: "filmParaIn 0.8s ease 200ms both" }}
            >
              <p
                className={`text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.28em] ${
                  sup.dark
                    ? "text-charcoal/75"
                    : "text-white/90 [text-shadow:0_1px_8px_rgba(0,0,0,0.6)]"
                }`}
              >
                {sup.label}
              </p>
              <span className="block w-10 h-[3px] bg-sky mt-1.5 rounded-full" />
            </div>
          );
        })()}
      </div>

      {/* ── top chrome: nav + transport ── */}
      <header className="absolute top-0 inset-x-0 z-20">
        <div className="bg-gradient-to-b from-black/55 to-transparent pb-6">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
            <span className="font-extrabold text-white tracking-tight text-lg [text-shadow:0_1px_6px_rgba(0,0,0,0.5)]">
              Donkey Dreams
            </span>
            <nav className="hidden md:flex items-center gap-5">
              {NAV.map((n) => (
                <Link key={n.label} href={n.href} className="text-sm font-semibold text-white/85 hover:text-white transition-colors">
                  {n.label}
                </Link>
              ))}
            </nav>
            <Link
              href="/donate"
              className="shrink-0 px-4 py-2 rounded-full bg-sky text-charcoal text-sm font-extrabold hover:bg-sky-light transition-colors"
            >
              Donate Now
            </Link>
          </div>
          {/* transport */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-3 mt-1">
            <button
              onClick={togglePlay}
              className="shrink-0 w-8 h-8 rounded-full bg-white/15 backdrop-blur text-white flex items-center justify-center hover:bg-white/30 transition-colors"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <div
              className="relative flex-1 h-5 flex items-center cursor-pointer group"
              onClick={onScrub}
              onMouseMove={onScrubHover}
              onMouseLeave={() => setHoverTip(null)}
            >
              <div className="w-full h-[5px] group-hover:h-[8px] transition-all rounded-full bg-white/25 overflow-hidden">
                <div
                  className="h-full bg-sky rounded-full"
                  style={{ width: `${Math.min(100, (progress / total) * 100)}%` }}
                />
              </div>
              {/* chapter ticks */}
              {starts.map((s, i) =>
                i > 0 ? (
                  <span
                    key={i}
                    className="absolute top-1/2 -translate-y-1/2 w-[2px] h-[5px] bg-black/30"
                    style={{ left: `${(s / total) * 100}%` }}
                  />
                ) : null
              )}
              {hoverTip && (
                <span
                  className="absolute bottom-6 -translate-x-1/2 px-2 py-1 rounded bg-black/80 text-white text-[11px] font-semibold whitespace-nowrap"
                  style={{ left: hoverTip.x }}
                >
                  {hoverTip.label}
                </span>
              )}
            </div>
            <button
              onClick={soundOn ? disableSound : enableSound}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-bold transition-colors ${
                soundOn
                  ? "bg-sky text-charcoal"
                  : "bg-white/15 backdrop-blur text-white hover:bg-white/30"
              }`}
            >
              {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{soundOn ? "Narration on" : "Narration"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* tap-for-sound chip (until armed) */}
      {!soundOn && idx < scenes.length - 1 && (
        <button
          onClick={enableSound}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/60 backdrop-blur text-white text-sm font-bold hover:bg-black/80 transition-colors"
        >
          <Volume2 className="w-4 h-4" />
          Tap for narration
        </button>
      )}
    </div>
  );
}
