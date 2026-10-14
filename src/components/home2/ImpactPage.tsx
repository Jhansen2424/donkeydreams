"use client";

// ── Make an Impact (/donate) ──
// Copy verbatim from "Make an Impact — Copy, revised 10/14/2026".
// Herd Insider → Patreon (opens in a pop-up window: Patreon refuses to be
// embedded, so a pop-up is the closest to "don't take them off our site").
// Burro Family Circle + one-time → Zeffy, opened in an on-page modal via
// Zeffy's embed URL. All links live in src/lib/giving-links.ts.
// Photos are labeled placeholders until the client's picks arrive.

import { useEffect, useState, type ReactNode } from "react";
import { Camera, X, Heart, Users, ExternalLink } from "lucide-react";
import { GIVING, zeffyEmbedUrl } from "@/lib/giving-links";
import { NewHeader, NewFooter } from "./SiteChrome";

const heading = "font-extrabold tracking-tight leading-tight text-charcoal";

function PhotoSlot({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-peach via-sand-light to-sunset-light ${className}`}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
        <Camera className="w-7 h-7 text-charcoal/40" />
        <p className="text-[11px] font-bold uppercase tracking-wider text-charcoal/55">Photo · {label}</p>
      </div>
    </div>
  );
}

/** Patreon can't be framed, so open it in a centered pop-up window. */
function openPatreon(url: string) {
  const w = 520;
  const h = 780;
  const left = Math.max(0, window.screenX + (window.outerWidth - w) / 2);
  const top = Math.max(0, window.screenY + (window.outerHeight - h) / 2);
  const win = window.open(url, "dd-patreon", `popup,width=${w},height=${h},left=${left},top=${top}`);
  if (!win) window.open(url, "_blank", "noopener"); // pop-up blocked → new tab
}

const TIERS = [
  {
    key: "buddy" as const,
    name: "Burro Buddy",
    price: 5,
    copy: "Every month, we'll send you 2–3 behind-the-scenes photos and videos — hay time, naps in the shade, dust baths in the dirt. The quiet, ordinary moments that mean these donkeys are safe, loved, and exactly where they belong. A little piece of the sanctuary, delivered straight to you.",
  },
  {
    key: "explorer" as const,
    name: "Burro Explorer",
    price: 25,
    copy: "Everything in Burro Buddy, plus our monthly Inside the Herd spotlight — we'll share stories about one or more of our donkeys, so you can get to know who they really are and feel a deeper connection to the Donkey Dreams herd. Some months, we'll bring you along live for a walk down the trail with the herd, because some things are better felt than described.",
  },
  {
    key: "supporter" as const,
    name: "Burro Supporter",
    price: 55,
    copy: "Everything above, plus a quarterly journal straight from the sanctuary — the real story of life here: the magical moments, the solutions to challenging problems, and sometimes the heartbreak, told by the caretakers living it every day. A closer look at what's changing around the sanctuary and at our wild burro families. Consider it your invitation past the fence line, into what preserving the wild burro spirit really looks like.",
  },
  {
    key: "bestie" as const,
    name: "Burro Bestie",
    price: 75,
    copy: "Everything above, plus a monthly live hangout with our founders and the herd — real time, straight from the sanctuary. Bring your questions, meet the donkeys face to face, and feel, even just for an hour, what it's like to be part of their world.",
  },
];

const CIRCLE = [
  {
    key: "senior" as const,
    name: "Support a Senior Burro",
    price: 95,
    photo: "Reddish donkey next to a tree",
    copy: "Our seniors — burros over 30 — carry decades of history in their bones, and their bodies need specialized care to keep going. Custom-made meals are the difference between just getting by and truly thriving in their golden years. Step in for one of our elders, and help them grow old with the dignity they've earned. $95 is roughly what it costs each month for the specialized feed and supplements one of our elders needs to stay strong.",
  },
  {
    key: "momChild" as const,
    name: "Care for a Mom/Child Pair",
    price: 155,
    photo: "Dusk and Dawn staring at the camera",
    copy: "Most of our moms arrive already caring for a child and/or arrive pregnant and have their baby right here with us. We have more than 40 of these mom/child pairs at the sanctuary today, each one precious in its own way, and we treat that bond as sacred, not optional. What they need varies pair to pair: forage, soaked hay pellets, supplements — whatever keeps a particular mom and her child thriving together that month. Your gift helps make sure neither one goes without.",
  },
  {
    key: "family" as const,
    name: "Feed an Entire Burro Family",
    price: 357,
    photo: "Donkeys at the feeder",
    copy: "When we take in an entire burro family, we make them a promise: they will never be separated, and they will eat together, every single day, for the rest of their lives — just as they would in the wild. Burros can live up to 50 years. That's not a small promise, it's a lifetime one. Your monthly gift keeps it — forage for an entire family, together, for good.",
  },
];

function Section({ id, className = "", children }: { id?: string; className?: string; children: ReactNode }) {
  return (
    <section id={id} className={`scroll-mt-24 px-5 sm:px-8 ${className}`}>
      <div className="max-w-6xl mx-auto">{children}</div>
    </section>
  );
}

export default function ImpactPage() {
  // Zeffy checkout modal: { title, url } — url null = not connected yet
  const [modal, setModal] = useState<{ title: string; url: string | null } | null>(null);

  useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setModal(null);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [modal]);

  return (
    <div className="bg-cream text-charcoal">
      <NewHeader />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover"
          style={{ backgroundImage: "url(/images/film/impact-hero.webp)", backgroundPosition: "center 40%" }}
        />
        {/* the photo is already a blazing sunset — darken just enough for the
            text, and let the sky show through at the top */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#2a160b]/90 via-[#3b1f10]/55 to-[#3b1f10]/15" />
        <div className="relative max-w-4xl mx-auto px-5 sm:px-8 py-24 sm:py-32 text-center text-white">
          <h1 className="font-extrabold tracking-tight leading-tight text-4xl sm:text-6xl mb-5">Make an Impact</h1>
          <span className="block w-20 h-1.5 rounded-full bg-gradient-to-r from-sunset-light to-sunset mx-auto mb-8" />
          <p className="text-lg sm:text-2xl leading-relaxed text-white/95 mb-6">
            Everything at Donkey Dreams exists because people were inspired to give them a home.
            Give, and you're part of it — for every family already home, and every one still waiting.
          </p>
          <p className="text-base sm:text-lg leading-relaxed text-white/85 max-w-3xl mx-auto">
            As a GFAS-accredited sanctuary with no paid staff and practically no overhead, nearly
            every dollar you give goes straight to keeping families whole, giving them room to roam,
            and preserving the wild burro spirit — not administrative costs.
          </p>
        </div>
      </section>

      {/* ── Two ways to give ── */}
      <Section id="two-ways" className="py-20 bg-peach">
        <h2 className={`${heading} text-3xl sm:text-5xl text-center mb-6`}>Two Ways to Give</h2>
        <div className="max-w-3xl mx-auto space-y-4 text-base sm:text-lg leading-relaxed text-warm-gray text-center mb-12">
          <p>
            There are two ways to become part of the Donkey Dreams family, and which one's right for
            you depends on how you want to preserve the wild burro spirit and connect with the
            Donkey Dreams herd.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <a
            href="#herd-insider"
            className="group bg-white rounded-2xl border border-card-border p-7 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="w-11 h-11 rounded-full bg-sky/20 flex items-center justify-center">
                <Heart className="w-5 h-5 text-sky-dark" />
              </span>
              <div>
                <h3 className={`${heading} text-2xl`}>Herd Insider</h3>
                <p className="text-sm font-bold text-sky-dark">From $5/month</p>
              </div>
            </div>
            <p className="text-warm-gray leading-relaxed">
              Herd Insider are about staying close to the herd — photos, stories, and real moments
              from life at the sanctuary, with more access the deeper you go.
            </p>
            <p className="mt-4 text-sm font-extrabold text-sky-dark group-hover:underline">See memberships →</p>
          </a>
          <a
            href="#family-circle"
            className="group bg-white rounded-2xl border border-card-border p-7 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="w-11 h-11 rounded-full bg-[#6f9b67]/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#4f7a48]" />
              </span>
              <div>
                <h3 className={`${heading} text-2xl`}>Burro Family Circle</h3>
                <p className="text-sm font-bold text-[#4f7a48]">From $95/month</p>
              </div>
            </div>
            <p className="text-warm-gray leading-relaxed">
              Burro Family Circle is something a little different: it's for people who want their
              monthly gift tied directly to a specific, ongoing need — a senior's diet, a mom and her
              child's care, an entire family's forage. Every Burro Family Circle option already
              includes Herd Insider updates, so you're never missing what's happening with the herd
              either way.
            </p>
            <p className="mt-4 text-sm font-extrabold text-[#4f7a48] group-hover:underline">See the options →</p>
          </a>
        </div>
        <p className="max-w-3xl mx-auto text-center text-base sm:text-lg leading-relaxed text-warm-gray">
          Not sure which fits? If you want to feel close to the herd day to day, start with Herd
          Insider. If you'd rather your gift go toward one specific, ongoing need, look at Burro
          Family Circle. And if you'd rather give once instead of monthly, that option's always here
          too —{" "}
          <a href="#give-once" className="font-bold text-sunset-dark underline underline-offset-2">
            choose your own donation amount and frequency
          </a>
          .
        </p>
      </Section>

      {/* ── Herd Insider ── */}
      <Section id="herd-insider" className="py-20 bg-white">
        <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-sunset-dark text-center mb-3">
          Monthly memberships
        </p>
        <h2 className={`${heading} text-3xl sm:text-5xl text-center mb-6`}>Herd Insider Memberships</h2>
        <p className="max-w-3xl mx-auto text-center text-base sm:text-lg leading-relaxed text-warm-gray mb-12">
          Herd Insider Memberships are four simple ways to stay close to the herd every month —
          behind-the-scenes photos and videos, personal spotlights on individual donkeys and their
          families, deeper updates from our caretakers, and live hangouts with our founders,
          depending on the level you choose. Your membership dollars also help provide care for our
          donkeys. Memberships run through our Patreon page: pick the option that feels right, join
          in a couple of clicks, and adjust or cancel anytime.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {TIERS.map((t, i) => (
            <div
              key={t.key}
              className={`flex flex-col rounded-2xl border-2 p-6 ${
                i === TIERS.length - 1
                  ? "border-sunset bg-peach shadow-lg"
                  : "border-card-border bg-cream/50"
              }`}
            >
              <span className="block w-8 h-1 rounded-full bg-sky mb-4" />
              <h3 className={`${heading} text-xl`}>{t.name}</h3>
              <p className="mt-1 mb-4">
                <span className="text-4xl font-extrabold text-sunset-dark">${t.price}</span>
                <span className="text-sm font-semibold text-warm-gray">/month</span>
              </p>
              <p className="text-sm leading-relaxed text-warm-gray flex-1">{t.copy}</p>
              <button
                onClick={() => openPatreon(GIVING.patreon[t.key] ?? GIVING.patreon.page)}
                className="mt-6 inline-flex items-center justify-center gap-1.5 w-full py-3 rounded-full bg-charcoal text-white text-sm font-extrabold hover:bg-sunset-dark transition-colors"
              >
                Join on Patreon <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <button
            onClick={() => openPatreon(GIVING.patreon.page)}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-sunset text-white text-base font-extrabold hover:bg-sunset-dark transition-colors shadow-lg shadow-sunset/30"
          >
            Join Herd Insider <ExternalLink className="w-4 h-4" />
          </button>
          <p className="text-xs text-warm-gray mt-3">Opens Patreon in a small window — this page stays right here.</p>
        </div>
      </Section>

      {/* ── Burro Family Circle ── */}
      <Section id="family-circle" className="py-20 bg-peach">
        <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-[#4f7a48] text-center mb-3">
          Higher-tier monthly giving
        </p>
        <h2 className={`${heading} text-3xl sm:text-5xl text-center mb-6`}>Burro Family Circle</h2>
        <p className="max-w-3xl mx-auto text-center text-base sm:text-lg leading-relaxed text-warm-gray mb-12">
          Family is at the center of everything we do here. Most of the families at Donkey Dreams
          came to us together — and we actively seek out families still intact, because that bond is
          one we're not willing to treat as optional. Wild burros live in tight-knit bands: raising
          their young together, grazing together, growing old side by side. The Burro Family Circle is
          for the people who understand that, and who want to help us keep it that way. Your monthly
          gift helps keep real families fed, together, and whole — for as long as they live. You'll
          also receive our Herd Insider updates along the way: photos, stories, and live moments from
          across the herd, so you can see what that care makes possible.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {CIRCLE.map((c) => (
            <div key={c.key} className="flex flex-col bg-white rounded-2xl border border-card-border overflow-hidden shadow-sm">
              <PhotoSlot label={c.photo} className="aspect-[4/3]" />
              <div className="flex flex-col flex-1 p-6">
                <span className="block w-8 h-1 rounded-full bg-[#6f9b67] mb-4" />
                <h3 className={`${heading} text-xl`}>{c.name}</h3>
                <p className="mt-1 mb-4">
                  <span className="text-4xl font-extrabold text-sunset-dark">${c.price}</span>
                  <span className="text-sm font-semibold text-warm-gray">/month</span>
                </p>
                <p className="text-sm leading-relaxed text-warm-gray flex-1">{c.copy}</p>
                <button
                  onClick={() => setModal({ title: c.name, url: GIVING.zeffy[c.key] })}
                  className="mt-6 w-full py-3 rounded-full bg-sunset text-white text-sm font-extrabold hover:bg-sunset-dark transition-colors shadow-md shadow-sunset/25"
                >
                  Give Monthly
                </button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Give once ── */}
      <Section id="give-once" className="py-20 bg-white">
        <h2 className={`${heading} text-3xl sm:text-4xl text-center mb-4`}>
          Choose Your Own Donation Amount and Frequency
        </h2>
        <p className="max-w-2xl mx-auto text-center text-base sm:text-lg text-warm-gray mb-10">
          Every gift, any size, goes to the herd.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="rounded-2xl border-2 border-sunset bg-peach p-6 text-center flex flex-col">
            <h3 className={`${heading} text-lg mb-2`}>Online</h3>
            <p className="text-sm text-warm-gray flex-1">
              Any amount — one-time, monthly, quarterly, or yearly. Card or bank, through Zeffy,
              so 100% of your gift reaches the sanctuary.
            </p>
            <button
              onClick={() => setModal({ title: "Choose Your Amount & Frequency", url: GIVING.zeffy.oneTime })}
              className="mt-5 w-full py-3 rounded-full bg-sunset text-white text-sm font-extrabold hover:bg-sunset-dark transition-colors shadow-md shadow-sunset/25"
            >
              Choose Amount &amp; Frequency
            </button>
          </div>
          <div className="rounded-2xl border border-card-border bg-cream/50 p-6 text-center">
            <h3 className={`${heading} text-lg mb-2`}>Venmo</h3>
            <p className="text-sm text-warm-gray">Find us at</p>
            <p className="font-bold text-sky-dark mt-1 break-all">{GIVING.venmo}</p>
          </div>
          <div className="rounded-2xl border border-card-border bg-cream/50 p-6 text-center">
            <h3 className={`${heading} text-lg mb-2`}>Zelle</h3>
            <p className="text-sm text-warm-gray">Send to</p>
            <p className="font-bold text-sky-dark mt-1 break-all">{GIVING.zelle}</p>
          </div>
          <div className="rounded-2xl border border-card-border bg-cream/50 p-6 text-center">
            <h3 className={`${heading} text-lg mb-2`}>Mail a Check</h3>
            {GIVING.mail.map((line) => (
              <p key={line} className="text-sm text-warm-gray">
                {line}
              </p>
            ))}
          </div>
        </div>
      </Section>

      <NewFooter />

      {/* ── Zeffy checkout modal ── */}
      {modal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-6"
          onClick={() => setModal(null)}
          role="dialog"
          aria-modal="true"
          aria-label={modal.title}
        >
          <div
            className="relative bg-white w-full max-w-xl h-[88svh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-card-border">
              <p className="font-extrabold text-charcoal">{modal.title}</p>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-full hover:bg-cream" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            {modal.url ? (
              <iframe
                title={`${modal.title} — secure checkout`}
                src={zeffyEmbedUrl(modal.url)}
                className="flex-1 w-full border-0"
                allow="payment"
              />
            ) : (
              // not connected yet: point people at the ways that work today
              <div className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-4">
                <Heart className="w-10 h-10 text-sky-dark" />
                <p className="text-lg font-extrabold text-charcoal">Online checkout is almost ready</p>
                <p className="text-sm text-warm-gray max-w-sm">
                  Until it is, you can give through Venmo at <strong>{GIVING.venmo}</strong>, Zelle to{" "}
                  <strong>{GIVING.zelle}</strong>, or by mailing a check to {GIVING.mail.join(", ")}.
                </p>
                <button
                  onClick={() => setModal(null)}
                  className="mt-2 px-6 py-2.5 rounded-full bg-charcoal text-white text-sm font-bold"
                >
                  Got it
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
