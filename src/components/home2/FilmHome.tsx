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
import SceneArt, { type SceneKind, type SceneTone } from "./SceneArt";

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
  children,
}: {
  src: string;
  darker?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="absolute inset-0">
      <div
        className="absolute inset-0 bg-cover bg-center"
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
  wordMs = 36,
}: {
  text: string;
  active: boolean;
  delay?: number;
  className?: string;
  wordMs?: number;
}) {
  const words = useMemo(() => text.split(" "), [text]);
  // The space lives OUTSIDE each animated span: inline-block spans swallow
  // their trailing whitespace, which jammed every word together (client
  // screenshot, 10/13).
  return (
    <p className={className}>
      {words.map((w, i) => (
        <span key={i}>
          <span
            className="film-word"
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
      dur: 5,
      clip: "hero",
      clipOffset: 0,
      render: (a) => (
        <Bleed src={`${IMG}/pano-ridge-golden.png`} darker>
          <div className="absolute inset-0 flex items-center justify-center px-8">
            <A active={a} anim="filmFadeUp" delay={600}>
              <p className={`${heading} text-3xl sm:text-5xl text-white text-center max-w-3xl`}>
                Somewhere in the Arizona desert…
              </p>
            </A>
          </div>
        </Bleed>
      ),
    },
    {
      id: "cold2",
      title: "Opening",
      dur: 5,
      clip: "hero",
      clipOffset: 5,
      render: (a) => (
        <Bleed src={`${IMG}/pano-herd-rocks.png`} darker>
          <div className="absolute inset-0 flex items-center justify-center px-8">
            <A active={a} anim="filmFadeUp" delay={300}>
              <p className={`${heading} text-3xl sm:text-5xl text-white text-center max-w-4xl`}>
                …there's a place where wild burro families never have to say goodbye.
              </p>
            </A>
          </div>
        </Bleed>
      ),
    },
    // ═══ Hero ═══
    {
      id: "hero",
      title: "Preserving the Wild Burro Spirit",
      dur: 7,
      clip: "hero",
      clipOffset: 10,
      render: (a) => (
        <Bleed src={`${IMG}/pano-sunset-trough.png`}>
          <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
            <A active={a} anim="filmFadeUp" delay={200}>
              <h1 className={`${heading} text-4xl sm:text-6xl lg:text-7xl text-white max-w-5xl`}>
                Preserving the Wild Burro Spirit
              </h1>
            </A>
            <A active={a} anim="filmFadeUp" delay={1700}>
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
        <Bleed src={`${IMG}/pano-sunset-graze.png`} darker>
          <div className="absolute inset-0 flex items-center justify-center px-5 sm:px-10 overflow-hidden">
            <div className="bg-black/45 backdrop-blur-sm rounded-2xl px-6 sm:px-10 py-6 sm:py-8 max-w-3xl max-h-[72svh] overflow-hidden space-y-4">
              <Pour
                active={a}
                delay={500}
                text="In the wild, a burro's life revolves around family — a mother close by, a sibling, a herd they've known for years. Freedom, for a burro, means family — and it's not just behavior. A burro feels those bonds the same way we feel love, and the same way we feel it when we lose someone we love. Those bonds are real, and they run deep."
                className="text-base sm:text-xl text-white/95 leading-relaxed"
              />
              <Pour
                active={a}
                delay={9000}
                text="When they're removed from the wild, that changes in an instant. One moment they're part of a herd that's never been apart. The next, they're alone. Too often, what comes next isn't a wild burro habitat at all. It's a pen. A corral. The same four fence lines, every day, for the rest of their lives. They don't just lose their freedom. They carry what they lost."
                className="text-base sm:text-xl text-white/95 leading-relaxed"
              />
              <Pour
                active={a}
                delay={19500}
                text="That's the gap Donkey Dreams exists to close — a place where burros removed from the wild can live out their lives with family intact, on their own terms."
                className="text-base sm:text-xl font-semibold text-white leading-relaxed"
              />
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
      dur: 20,
      clip: "promise",
      clipOffset: 5,
      render: (a) => (
        <Bleed src={`${IMG}/pano-white-donkeys.png`} darker>
          <div className="absolute inset-0 flex flex-col items-center justify-center px-5 sm:px-10 gap-7">
            <div className="bg-black/45 backdrop-blur-sm rounded-2xl px-6 sm:px-10 py-6 max-w-3xl">
              <Pour
                active={a}
                delay={400}
                text="At Donkey Dreams, burros removed from the wild get back the life they once had. Nearly 100 donkeys and wild burros live here today. Most arrived as family; some arrived alone and found one here — either way, no one goes it alone. We believe that takes three things:"
                className="text-base sm:text-xl text-white/95 leading-relaxed"
              />
            </div>
            {/* the three pillars: big, bold, hold */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 items-center">
              {["Families whole.", "Room to roam.", "Sovereignty honored."].map((p, i) => (
                <A key={p} active={a} anim="filmGrowHold" delay={8000 + i * 2600}>
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
        <Bleed src={`${IMG}/pano-ridge-golden.png`}>
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
        <Bleed src={`${IMG}/pano-herd-rocks.png`}>
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
      dur: 15,
      clip: "trust",
      clipOffset: 0,
      render: (a) => (
        <div className="absolute inset-0">
          <Bleed src={`${IMG}/section-6-trust-amber-dusk.png`} darker />
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${IMG}/pano-white-donkeys.png)`,
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
            <Pour
              active={a}
              delay={1600}
              text="In the wild, a burro decides how to spend their day. Where to graze. When to rest. Who to stand beside. We don't take that away just because they need care. When a donkey needs treatment, our caretakers go to them, wherever they are — we don't run them in herds and we don't chase them. Every donkey gets the care they need, fully. What's different is how we get there."
              className="text-base sm:text-xl text-white/95 leading-relaxed max-w-2xl [text-shadow:0_1px_10px_rgba(0,0,0,0.7)]"
            />
          </div>
        </div>
      ),
    },
    {
      id: "sovereignty",
      title: "Sovereignty",
      dur: 7,
      clip: "trust",
      clipOffset: 15,
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
    ...(
      [
        {
          id: "gabriel",
          name: "Gabriel",
          dur: 7,
          off: 3.5,
          img: null,
          art: { tone: "gold" as SceneTone, kind: "lone" as SceneKind },
          text: "Found wild and alone at just a few months old — injured, with no mother in sight. He needed a family, and he needed a prosthetic leg. Today he has both — enough to run, to play, and to stand watch over the family that took him in.",
        },
        {
          id: "jackjack",
          name: "Jack-Jack",
          dur: 6.5,
          off: 10.5,
          img: null,
          art: { tone: "amber" as SceneTone, kind: "herd" as SceneKind },
          text: "When Jack-Jack's mother died suddenly, he was only seven months old. Grief like that can be its own kind of danger for a burro. His herd was what kept him going.",
        },
        {
          id: "xander",
          name: "Xander",
          dur: 6.5,
          off: 17,
          img: null,
          art: { tone: "dawn" as SceneTone, kind: "pair" as SceneKind },
          text: "Pulled from the slaughter pipeline — separated from his family at a livestock auction, headed to Mexico. It took us a year to bring him home. Now he's the only known father in a herd that includes two of his own sons.",
        },
        {
          id: "braveherd",
          name: "The Brave Herd",
          dur: 7.5,
          off: 23.5,
          img: `${IMG}/story-brave-herd.webp`,
          art: null,
          text: "Some of the most terrified wild burros we'd ever met. We didn't force anything — we let them learn to trust us in their own time. Now three generations of that family live here together.",
        },
      ] as const
    ).map(
      (s): SceneDef => ({
        id: s.id,
        title: `Their Stories — ${s.name}`,
        dur: s.dur,
        clip: "stories",
        clipOffset: s.off,
        render: (a) => (
          <div className="absolute inset-0 bg-cream-dark flex items-center px-5 sm:px-12">
            <div className="max-w-5xl mx-auto w-full grid md:grid-cols-2 gap-6 md:gap-10 items-center">
              <A active={a} anim="filmFadeUp" delay={150}>
                <div className="relative aspect-[16/11] md:aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
                  {s.img ? (
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${s.img})` }}
                    />
                  ) : (
                    <SceneArt tone={s.art!.tone} kind={s.art!.kind} parallax={false} />
                  )}
                </div>
              </A>
              <div>
                <A active={a} anim="filmFadeUp" delay={500}>
                  <h3 className={`${heading} text-3xl sm:text-5xl text-charcoal mb-4`}>
                    {s.name}
                  </h3>
                </A>
                <Pour
                  active={a}
                  delay={900}
                  text={s.text}
                  className="text-base sm:text-xl text-warm-gray leading-relaxed"
                />
              </div>
            </div>
          </div>
        ),
      })
    ),
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
                style={{ backgroundImage: `url(${IMG}/section-8-how-it-started.png)` }}
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
                style={{ backgroundImage: `url(${IMG}/pano-sunset-graze.png)` }}
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
        <Bleed src={`${IMG}/section-10-vision.png`} darker>
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
    { label: "Our Story", href: "/our-story", img: `${IMG}/section-8-how-it-started.png` },
    { label: "Their Stories", href: "/donkeys", img: `${IMG}/story-brave-herd.webp` },
    { label: "Save More Families", href: "/how-to-help", img: `${IMG}/pano-white-donkeys.png` },
    { label: "Make an Impact", href: "/donate", img: `${IMG}/section-10-vision.png` },
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
        @keyframes filmWordIn { to { opacity: 1; } }
        .film-word { opacity: 0; display: inline-block; animation: filmWordIn 0.3s ease forwards; animation-play-state: paused; }
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
