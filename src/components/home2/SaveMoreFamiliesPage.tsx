// ── Save More Families (/save-more-families) ──
// Copy verbatim from the client's Save More Families doc (10/15). Sky blue
// and deep dusk are this page's accent, the way sunset orange is Make an
// Impact's and juniper is Our Story's. The "blueprint" grid ties the visuals
// to the copy's idea: a sanctuary model tested in Kingman, ready to repeat.
// Photos arrive named by section: save each as
// public/images/save-more-families/<key>.webp and point PHOTOS[key] at it.

import type { ReactNode } from "react";
import {
  ArrowRight,
  Cpu,
  Droplets,
  Hammer,
  Home,
  Mail,
  Mountain,
  Stethoscope,
  Truck,
  Wrench,
  Zap,
} from "lucide-react";
import { GIVING } from "@/lib/giving-links";
import { NewHeader, NewFooter } from "./SiteChrome";
import { Reveal } from "./Reveal";
import { ZeffyGive } from "./ZeffyGive";

const heading = "font-extrabold tracking-tight leading-tight text-charcoal";
const body = "text-warm-gray text-base sm:text-lg leading-relaxed";

const PHOTOS: Record<string, string | null> = {
  hero: null,
  "known-by-name": null,
  "bringing-the-blueprint": null,
  "a-bigger-role": null,
};

const STAND_IN: Record<string, string> = {
  hero: "/images/film/section-9-savemore.webp",
};

/** Faint blueprint grid for the dusk bands. */
const BLUEPRINT = {
  backgroundImage:
    "linear-gradient(rgba(92,205,243,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(92,205,243,0.09) 1px, transparent 1px)",
  backgroundSize: "36px 36px",
};

function Photo({ k, label, alt, pos = "center", className = "" }: { k: string; label: string; alt: string; pos?: string; className?: string }) {
  const src = PHOTOS[k];
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 translate-x-3 translate-y-3 sm:translate-x-4 sm:translate-y-4 rounded-[2rem] bg-sky/25" />
      <div className="relative h-full rounded-[2rem] overflow-hidden shadow-xl bg-horizon">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} loading="lazy" className="w-full h-full object-cover" style={{ objectPosition: pos }} />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center bg-gradient-to-br from-horizon via-cream to-sky-light/40">
            <span className="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center">
              <Mountain className="w-5 h-5 text-sky-ink" />
            </span>
            <p className="text-[11px] font-bold uppercase tracking-wider text-charcoal/55">Photo · {label}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Eyebrow({ children, light }: { children: ReactNode; light?: boolean }) {
  return (
    <p className={`text-xs font-extrabold uppercase tracking-[0.28em] mb-4 ${light ? "text-sky-light" : "text-sky-ink"}`}>
      {children}
    </p>
  );
}

const BUILT = [
  { icon: Droplets, label: "Water" },
  { icon: Zap, label: "Power" },
  { icon: Home, label: "Housing for our caretakers" },
  { icon: Mountain, label: "A wild habitat laid out around what the herd actually needs" },
];

const SHARED = [
  { icon: Truck, label: "Hay deliveries" },
  { icon: Wrench, label: "Equipment" },
  { icon: Stethoscope, label: "Veterinary care" },
  { icon: Hammer, label: "Farrier care" },
  { icon: Cpu, label: "Our own proprietary sanctuary management technology" },
];

const mailto = `mailto:${GIVING.contact.email}?subject=${encodeURIComponent(GIVING.contact.saveMoreFamiliesSubject)}`;

export default function SaveMoreFamiliesPage() {
  return (
    <div className="bg-cream text-charcoal">
      <NewHeader />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden min-h-[70svh] flex items-end">
        <div
          className="absolute inset-0 bg-cover"
          style={{ backgroundImage: `url(${PHOTOS.hero ?? STAND_IN.hero})`, backgroundPosition: "center 55%" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dusk via-dusk/60 to-dusk/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-dusk/60 via-dusk/15 to-transparent" />
        <div className="relative w-full max-w-6xl mx-auto px-5 sm:px-8 pb-14 sm:pb-20 pt-40">
          <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-white/85 mb-4">Donkey Dreams Sanctuary</p>
          <h1 className="font-extrabold tracking-tight leading-none text-white text-5xl sm:text-7xl lg:text-8xl mb-6">
            Save More Families
          </h1>
          <span className="block w-24 h-1.5 rounded-full bg-gradient-to-r from-sky-light to-sky" />
        </div>
      </section>

      {/* ── The blueprint: what Kingman proved ── */}
      <section className="bg-dusk text-white px-5 sm:px-8 py-16 sm:py-24" style={BLUEPRINT}>
        <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <Reveal className="lg:col-span-7">
            <p className="text-lg sm:text-2xl leading-relaxed text-white/90">
              Four years in, we know something simple but important: keeping families whole, giving them room
              to roam, and honoring their right to still be who they are isn&apos;t just what we hope to do here
              — it&apos;s something we&apos;ve already done. When we moved the sanctuary to Kingman, we took raw
              land and turned it into a fully functioning sanctuary in just seven weeks: water, power, housing
              for our caretakers, and a wild habitat laid out around what the herd actually needs. That
              wasn&apos;t just proof it could be done once — it gave us a blueprint: tested in Kingman, and
              ready to bring to life again.
            </p>
          </Reveal>
          <Reveal delay={150} className="lg:col-span-5">
            <div className="rounded-3xl border border-sky/30 bg-dusk-light/70 backdrop-blur-sm p-7 sm:p-9">
              <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-sky-light mb-3">Kingman, Arizona</p>
              <p className="flex items-baseline gap-3 mb-1">
                <span className="text-7xl sm:text-8xl font-extrabold leading-none text-sky">7</span>
                <span className="text-2xl sm:text-3xl font-extrabold">weeks</span>
              </p>
              <p className="text-sm text-white/65 mb-7">raw land to a fully functioning sanctuary</p>
              <ul className="space-y-4">
                {BUILT.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-3">
                    <span className="shrink-0 w-9 h-9 rounded-lg border border-sky/40 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-sky" />
                    </span>
                    <span className="text-sm sm:text-base font-semibold text-white/90 leading-snug">{label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Known By Name ── */}
      <section className="px-5 sm:px-8 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <Reveal>
            <Photo
              k="known-by-name"
              label="Known By Name"
              alt="A donkey known by name, up close"
              className="aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5] mr-3 sm:mr-4"
            />
          </Reveal>
          <Reveal delay={120}>
            <Eyebrow>The vision</Eyebrow>
            <h2 className={`${heading} text-3xl sm:text-5xl mb-6`}>Known By Name</h2>
            <p className={body}>
              That&apos;s the vision behind Save More Families — though it isn&apos;t about one sanctuary growing
              bigger and bigger. The larger a herd gets, the easier it becomes to manage the group and lose the
              individual: donkeys start to blur into numbers instead of personalities, and the quiet, careful
              noticing that catches when one particular animal needs something starts to slip away. That&apos;s
              exactly what we refuse to let happen.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Bringing the Blueprint to Life ── */}
      <section className="bg-white px-5 sm:px-8 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <Reveal className="lg:order-2">
            <Photo
              k="bringing-the-blueprint"
              label="Bringing the Blueprint to Life"
              alt="Open land ready to become a new sanctuary"
              className="aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5] mr-3 sm:mr-4"
            />
          </Reveal>
          <Reveal delay={120}>
            <Eyebrow>The plan</Eyebrow>
            <h2 className={`${heading} text-3xl sm:text-5xl mb-6`}>Bringing the Blueprint to Life</h2>
            <p className={body}>
              Instead, our plan is to bring that blueprint to life again in new sanctuaries throughout this
              region — each one run by a small Herd Caretaker community we train and support directly, under
              the Donkey Dreams model and our oversight, and sharing in the same resources that keep ours
              running well: hay deliveries, equipment, veterinary care, farrier care, and our own proprietary
              sanctuary management technology among them.
            </p>
            <p className="mt-8 mb-4 text-xs font-extrabold uppercase tracking-[0.25em] text-charcoal/50">
              Shared by every sanctuary
            </p>
            <ul className="grid grid-cols-2 gap-3">
              {SHARED.map(({ icon: Icon, label }, i) => (
                <li
                  key={label}
                  className={`flex items-center gap-3 rounded-2xl border border-horizon-border bg-horizon px-4 py-3 ${
                    i === SHARED.length - 1 ? "col-span-2" : ""
                  }`}
                >
                  <Icon className="shrink-0 w-5 h-5 text-sky-ink" />
                  <span className="text-sm font-bold text-charcoal leading-snug">{label}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ── The promise of staying small ── */}
      <section className="bg-horizon border-y border-horizon-border px-5 sm:px-8 py-16 sm:py-24">
        <Reveal className="max-w-4xl mx-auto text-center">
          <p className="text-2xl sm:text-4xl font-extrabold leading-snug text-charcoal">
            Small enough that a Herd Caretaker community can actually come to know every animal in their care,
            the same way we know ours — so we can{" "}
            <span className="text-sky-ink">grow more, without knowing less.</span>
          </p>
        </Reveal>
      </section>

      {/* ── The Save More Families Fund ── */}
      <section id="fund" className="scroll-mt-24 bg-dusk text-white px-5 sm:px-8 py-16 sm:py-24" style={BLUEPRINT}>
        <Reveal className="max-w-3xl mx-auto text-center">
          <Eyebrow light>Give to the fund</Eyebrow>
          <h2 className="font-extrabold tracking-tight leading-tight text-3xl sm:text-5xl mb-8">
            The Save More Families Fund
          </h2>
          <p className="text-base sm:text-lg leading-relaxed text-white/85 mb-10">
            The Save More Families Fund is how that vision becomes real — and it&apos;s dedicated entirely to
            welcoming new families home, not to the daily care of the families already here. Every gift goes
            directly toward the land, training, and resources it takes to open our gates to another family after
            they&apos;ve been removed from the wild, and give them that same lifelong chance to be kept whole,
            roam freely, and hold onto their wild spirit for good. Give what you can; any amount moves us closer.
          </p>
          {GIVING.zeffy.saveMoreFamilies && (
            <ZeffyGive
              url={GIVING.zeffy.saveMoreFamilies}
              title="The Save More Families Fund"
              className="inline-flex items-center gap-2 px-9 py-4 rounded-full bg-sky text-charcoal text-base sm:text-lg font-extrabold hover:bg-sky-light transition-colors shadow-lg shadow-sky/20"
            >
              Give to the Fund <ArrowRight className="w-5 h-5" />
            </ZeffyGive>
          )}
        </Reveal>
      </section>

      {/* ── A Bigger Role ── */}
      <section className="px-5 sm:px-8 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <Reveal>
            <Photo
              k="a-bigger-role"
              label="A Bigger Role"
              alt="Talking through the plan at the sanctuary"
              className="aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5] mr-3 sm:mr-4"
            />
          </Reveal>
          <Reveal delay={120}>
            <Eyebrow>Get involved</Eyebrow>
            <h2 className={`${heading} text-3xl sm:text-5xl mb-6`}>A Bigger Role</h2>
            <p className={body}>
              And if you&apos;d like a better understanding of the plan — to see how you might get involved, or
              help support it in a bigger way — reach out to us directly. We&apos;ll walk you through it
              together.
            </p>
            <a
              href={mailto}
              className="mt-8 inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-dusk text-white text-base font-extrabold hover:bg-sky-ink transition-colors"
            >
              <Mail className="w-5 h-5" /> Talk to Us <ArrowRight className="w-4 h-4" />
            </a>
          </Reveal>
        </div>
      </section>

      {/* ── Closing ── */}
      <section className="relative overflow-hidden bg-dusk px-5 sm:px-8 py-20 sm:py-28 text-center">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[46rem] h-[46rem] rounded-full bg-sky/10 blur-3xl" />
        <Reveal className="relative max-w-3xl mx-auto">
          <p className="text-2xl sm:text-4xl font-extrabold leading-snug text-white">
            However you take part, you&apos;re helping make sure the right to still be who they are reaches more
            than just the families already home.
          </p>
        </Reveal>
      </section>

      <NewFooter />
    </div>
  );
}
