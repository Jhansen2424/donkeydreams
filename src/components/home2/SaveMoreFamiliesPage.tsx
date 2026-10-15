// ── Save More Families (/save-more-families) ──
// Copy verbatim from the client's Save More Families doc (10/15). One of the
// heartfelt pages (client, 10/15): light and warm, photo-led, no dark bands
// or diagram-style graphics. Soft sky blue is its accent, the way sunset
// orange is Make an Impact's and juniper is Our Story's.
// Photos: public/images/save-more-families/<key>.webp, wired in PHOTOS.

import type { ReactNode } from "react";
import { ArrowRight, Heart, Mail } from "lucide-react";
import { GIVING } from "@/lib/giving-links";
import { NewHeader, NewFooter } from "./SiteChrome";
import { Reveal } from "./Reveal";
import { ZeffyGive } from "./ZeffyGive";

const heading = "font-extrabold tracking-tight leading-tight text-charcoal";
const body = "text-warm-gray text-base sm:text-lg leading-relaxed";

const PHOTOS = {
  hero: "/images/save-more-families/hero.webp",
  "known-by-name": "/images/save-more-families/known-by-name.webp",
  "bringing-the-blueprint": "/images/save-more-families/bringing-the-blueprint.webp",
  "a-bigger-role": "/images/save-more-families/a-bigger-role.webp",
};

function Photo({ src, alt, pos = "center", className = "" }: { src: string; alt: string; pos?: string; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 translate-x-3 translate-y-3 sm:translate-x-4 sm:translate-y-4 rounded-[2rem] bg-sky/20" />
      <div className="relative h-full rounded-[2rem] overflow-hidden shadow-xl bg-horizon">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading="lazy" className="w-full h-full object-cover" style={{ objectPosition: pos }} />
      </div>
    </div>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-xs font-extrabold uppercase tracking-[0.28em] mb-4 text-sky-ink">{children}</p>;
}

const mailto = `mailto:${GIVING.contact.email}?subject=${encodeURIComponent(GIVING.contact.saveMoreFamiliesSubject)}`;

export default function SaveMoreFamiliesPage() {
  return (
    <div className="bg-cream text-charcoal">
      <NewHeader />

      {/* ── Hero: title on cream, then the sanctuary under its big sky,
          shown whole in a wide soft frame ── */}
      <section className="pt-16 sm:pt-24">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 text-center">
          <Eyebrow>Donkey Dreams Sanctuary</Eyebrow>
          <h1 className="font-extrabold tracking-tight leading-none text-charcoal text-5xl sm:text-7xl lg:text-8xl">
            Save More Families
          </h1>
          <span className="block w-24 h-1.5 rounded-full bg-gradient-to-r from-sky-light to-sky mx-auto mt-7" />
        </div>
        <div className="mt-12 sm:mt-16 px-3 sm:px-6">
          <div className="relative max-w-7xl mx-auto rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl aspect-[4/3] sm:aspect-[16/8] lg:aspect-[21/9]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={PHOTOS.hero}
              alt="The sanctuary in Kingman under a big blue sky, the herd grazing between the shelters"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: "center 74%" }}
            />
          </div>
        </div>
      </section>

      {/* ── What Kingman proved ── */}
      <section className="px-5 sm:px-8 py-16 sm:py-24">
        <Reveal className="max-w-3xl mx-auto">
          <p className="text-xl sm:text-2xl leading-relaxed text-charcoal/80">
            Four years in, we know something simple but important: keeping families whole, giving them room to
            roam, and honoring their right to still be who they are isn&apos;t just what we hope to do here —
            it&apos;s something we&apos;ve already done. When we moved the sanctuary to Kingman, we took raw land
            and turned it into a fully functioning sanctuary{" "}
            <mark className="bg-sky/25 text-charcoal rounded px-1">in just seven weeks</mark>: water, power,
            housing for our caretakers, and a wild habitat laid out around what the herd actually needs. That
            wasn&apos;t just proof it could be done once — it gave us a blueprint: tested in Kingman, and ready
            to bring to life again.
          </p>
        </Reveal>
      </section>

      {/* ── Known By Name ── */}
      <section className="bg-white px-5 sm:px-8 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <Reveal>
            <Photo
              src={PHOTOS["known-by-name"]}
              alt="Two fuzzy young burros and the caretaker who knows them by name"
              pos="center 40%"
              className="aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5] mr-3 sm:mr-4"
            />
          </Reveal>
          <Reveal delay={120}>
            <h2 className={`${heading} text-4xl sm:text-6xl mb-8`}>Known By Name</h2>
            <p className={body}>
              That&apos;s the vision behind Save More Families — though it isn&apos;t about one sanctuary growing
              bigger and bigger. The larger a herd gets, the easier it becomes to manage the group and lose the
              individual:{" "}
              <span className="text-charcoal font-semibold">
                donkeys start to blur into numbers instead of personalities
              </span>
              , and the quiet, careful noticing that catches when one particular animal needs something starts to
              slip away.
            </p>
            <p className="mt-6 text-2xl sm:text-3xl font-extrabold leading-snug text-sky-ink">
              That&apos;s exactly what we refuse to let happen.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Bringing the Blueprint to Life ── */}
      <section className="px-5 sm:px-8 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <Reveal className="lg:order-2">
            <Photo
              src={PHOTOS["bringing-the-blueprint"]}
              alt="Hand-feeding a young burro with a prosthetic leg"
              pos="60% center"
              className="aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5] mr-3 sm:mr-4"
            />
          </Reveal>
          <Reveal delay={120}>
            <h2 className={`${heading} text-4xl sm:text-6xl mb-8`}>Bringing the Blueprint to Life</h2>
            <p className={body}>
              Instead, our plan is to bring that blueprint to life again in new sanctuaries throughout this
              region — each one run by a small Herd Caretaker community we train and support directly, under the
              Donkey Dreams model and our oversight, and sharing in the same resources that keep ours running
              well: hay deliveries, equipment, veterinary care, farrier care, and our own proprietary sanctuary
              management technology among them.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── The heart of it ── */}
      <section className="bg-horizon px-5 sm:px-8 py-20 sm:py-28">
        <Reveal className="max-w-4xl mx-auto text-center">
          <p aria-hidden className="text-7xl sm:text-8xl font-extrabold leading-none text-sky/50 -mb-4 sm:-mb-6">
            &ldquo;
          </p>
          <p className="text-2xl sm:text-4xl font-extrabold leading-snug text-charcoal">
            Small enough that a Herd Caretaker community can actually come to know every animal in their care,
            the same way we know ours — so we can{" "}
            <span className="text-sky-ink">grow more, without knowing less.</span>
          </p>
        </Reveal>
      </section>

      {/* ── The Save More Families Fund ── */}
      <section id="fund" className="scroll-mt-24 px-5 sm:px-8 py-16 sm:py-24">
        <Reveal className="max-w-4xl mx-auto">
          <div className="rounded-[2rem] sm:rounded-[2.5rem] bg-white border border-horizon-border shadow-xl px-6 py-12 sm:px-14 sm:py-16 text-center">
            <span className="inline-flex w-14 h-14 rounded-full bg-sky/20 items-center justify-center mb-6">
              <Heart className="w-6 h-6 text-sky-ink fill-sky/40" />
            </span>
            <h2 className={`${heading} text-3xl sm:text-5xl mb-8`}>The Save More Families Fund</h2>
            <p className={`${body} mb-10`}>
              The Save More Families Fund is how that vision becomes real — and it&apos;s dedicated entirely to
              welcoming new families home, not to the daily care of the families already here. Every gift goes
              directly toward the land, training, and resources it takes to open our gates to another family
              after they&apos;ve been removed from the wild, and give them that same lifelong chance to be kept
              whole, roam freely, and hold onto their wild spirit for good. Give what you can; any amount moves us
              closer.
            </p>
            {GIVING.zeffy.saveMoreFamilies && (
              <ZeffyGive
                url={GIVING.zeffy.saveMoreFamilies}
                title="The Save More Families Fund"
                className="inline-flex items-center gap-2 px-9 py-4 rounded-full bg-sky text-charcoal text-base sm:text-lg font-extrabold hover:bg-sky-light transition-colors shadow-lg shadow-sky/25"
              >
                Give to the Fund <ArrowRight className="w-5 h-5" />
              </ZeffyGive>
            )}
          </div>
        </Reveal>
      </section>

      {/* ── A Bigger Role ── */}
      <section className="bg-white px-5 sm:px-8 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <Reveal>
            <Photo
              src={PHOTOS["a-bigger-role"]}
              alt="Sitting cheek to cheek with a burro under a big desert sky"
              pos="center 45%"
              className="aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5] mr-3 sm:mr-4"
            />
          </Reveal>
          <Reveal delay={120}>
            <h2 className={`${heading} text-4xl sm:text-6xl mb-8`}>A Bigger Role</h2>
            <p className={body}>
              And if you&apos;d like a better understanding of the plan — to see how you might get involved, or
              help support it in a bigger way — reach out to us directly. We&apos;ll walk you through it together.
            </p>
            <a
              href={mailto}
              className="mt-8 inline-flex items-center gap-2 px-7 py-3.5 rounded-full border-2 border-sky-ink text-sky-ink text-base font-extrabold hover:bg-sky-ink hover:text-white transition-colors"
            >
              <Mail className="w-5 h-5" /> Talk to Us <ArrowRight className="w-4 h-4" />
            </a>
          </Reveal>
        </div>
      </section>

      {/* ── Closing ── */}
      <section className="px-5 sm:px-8 py-20 sm:py-28 bg-gradient-to-b from-cream to-horizon">
        <Reveal className="max-w-3xl mx-auto text-center">
          <Heart className="w-8 h-8 text-sky mx-auto mb-6 fill-sky/30" />
          <p className="text-2xl sm:text-4xl font-extrabold leading-snug text-charcoal">
            However you take part, you&apos;re helping make sure the right to still be who they are reaches more
            than just the families already home.
          </p>
        </Reveal>
      </section>

      <NewFooter />
    </div>
  );
}
