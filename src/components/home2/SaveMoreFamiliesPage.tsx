// ── Save More Families (/save-more-families) ──
// Copy verbatim from the client's Save More Families doc (10/15). A heartfelt
// page with its own layout language, unlike Make an Impact or Our Story:
// a bright sky hero, a letter-style intro card, and a held photo that
// dissolves as the story scrolls past it. Warm desert clay (terra) is its
// accent. Uses only the four photos supplied for this page.

import type { ReactNode } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { GIVING } from "@/lib/giving-links";
import { NewHeader, NewFooter } from "./SiteChrome";
import { Reveal } from "./Reveal";
import { StickyStory, type StoryPhoto } from "./StickyStory";
import { ZeffyGive } from "./ZeffyGive";

const heading = "font-extrabold tracking-tight leading-tight text-charcoal";
const body = "text-warm-gray text-base sm:text-lg leading-relaxed";

const HERO = "/images/save-more-families/hero.webp";
const BIGGER_ROLE = "/images/save-more-families/a-bigger-role.webp";

const STORY_PHOTOS: StoryPhoto[] = [
  {
    src: "/images/save-more-families/known-by-name.webp",
    alt: "A caretaker kneeling with two fuzzy young burros, looking up at them",
    pos: "center 40%",
  },
  {
    src: "/images/save-more-families/bringing-the-blueprint.webp",
    alt: "Hand-feeding a young burro with a prosthetic leg",
    pos: "60% center",
  },
];

function Eyebrow({ children, light }: { children: ReactNode; light?: boolean }) {
  return (
    <p className={`text-xs font-extrabold uppercase tracking-[0.28em] mb-4 ${light ? "text-terra-light" : "text-terra-dark"}`}>
      {children}
    </p>
  );
}

const mailto = `mailto:${GIVING.contact.email}?subject=${encodeURIComponent(GIVING.contact.saveMoreFamiliesSubject)}`;

/** Bright sky photo with the words up in the open blue: no dark wash. */
function SkyBand({ children, minH, pos }: { children: ReactNode; minH: string; pos: string }) {
  return (
    <div className={`relative overflow-hidden ${minH}`}>
      <div className="absolute inset-0 bg-cover" style={{ backgroundImage: `url(${HERO})`, backgroundPosition: pos }} />
      <div className="absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b from-[#1d4f86]/45 to-transparent" />
      {children}
    </div>
  );
}

const sky = "text-white [text-shadow:0_2px_30px_rgba(10,40,80,0.45)]";

export default function SaveMoreFamiliesPage() {
  return (
    <div className="bg-cream text-charcoal">
      <NewHeader />

      {/* ── Hero: the sanctuary under its big sky, title in the open blue ── */}
      <SkyBand minH="min-h-[88svh]" pos="center 70%">
        <div className="relative max-w-5xl mx-auto px-5 sm:px-8 pt-20 sm:pt-28 text-center">
          <p className={`text-xs sm:text-sm font-extrabold uppercase tracking-[0.3em] mb-5 ${sky}`}>
            Donkey Dreams Sanctuary
          </p>
          <h1 className={`font-extrabold tracking-tight leading-none text-5xl sm:text-7xl lg:text-8xl ${sky}`}>
            Save More Families
          </h1>
          <span className="block w-24 h-1.5 rounded-full bg-terra mx-auto mt-8 shadow" />
        </div>
      </SkyBand>

      {/* ── The letter: rises up over the bottom of the photo ── */}
      <section className="relative px-4 sm:px-8 -mt-32 sm:-mt-36">
        <Reveal className="max-w-4xl mx-auto">
          <div className="rounded-[2rem] sm:rounded-[2.5rem] bg-white shadow-2xl px-6 py-10 sm:px-14 sm:py-14">
            <p className="text-2xl sm:text-3xl font-extrabold leading-snug text-charcoal mb-5">
              Four years in, we know something simple but important:
            </p>
            <p className={`${body} sm:text-xl`}>
              keeping families whole, giving them room to roam, and honoring their right to still be who they are
              isn&apos;t just what we hope to do here — it&apos;s something we&apos;ve already done. When we moved
              the sanctuary to Kingman, we took raw land and turned it into a fully functioning sanctuary in{" "}
              <span className="font-bold text-terra-dark underline decoration-terra/40 decoration-4 underline-offset-4">
                just seven weeks
              </span>
              : water, power, housing for our caretakers, and a wild habitat laid out around what the herd actually
              needs. That wasn&apos;t just proof it could be done once — it gave us a blueprint: tested in Kingman,
              and ready to bring to life again.
            </p>
          </div>
        </Reveal>
      </section>

      {/* ── The held photo: dissolves as the story scrolls past ── */}
      <section className="px-5 sm:px-8 pt-10 sm:pt-16 pb-10">
        <StickyStory
          photos={STORY_PHOTOS}
          steps={[
            {
              photo: 0,
              content: (
                <>
                  <Eyebrow>The vision</Eyebrow>
                  <h2 className={`${heading} text-4xl sm:text-6xl mb-8`}>Known By Name</h2>
                  <p className={body}>
                    That&apos;s the vision behind Save More Families — though it isn&apos;t about one sanctuary
                    growing bigger and bigger. The larger a herd gets, the easier it becomes to manage the group and
                    lose the individual: donkeys start to blur into numbers instead of personalities, and the quiet,
                    careful noticing that catches when one particular animal needs something starts to slip away.
                  </p>
                  <p className="mt-8 text-2xl sm:text-3xl font-extrabold leading-snug text-terra-dark">
                    That&apos;s exactly what we refuse to let happen.
                  </p>
                </>
              ),
            },
            {
              photo: 1,
              content: (
                <>
                  <Eyebrow>The plan</Eyebrow>
                  <h2 className={`${heading} text-4xl sm:text-6xl mb-8`}>Bringing the Blueprint to Life</h2>
                  <p className={body}>
                    Instead, our plan is to bring that blueprint to life again in new sanctuaries throughout this
                    region — each one run by a small Herd Caretaker community we train and support directly, under
                    the Donkey Dreams model and our oversight, and sharing in the same resources that keep ours
                    running well: hay deliveries, equipment, veterinary care, farrier care, and our own proprietary
                    sanctuary management technology among them.
                  </p>
                </>
              ),
            },
            {
              photo: 1,
              inlinePhoto: false,
              content: (
                <p className="text-3xl sm:text-5xl lg:text-[2.6rem] font-extrabold leading-tight text-charcoal">
                  Small enough that a Herd Caretaker community can actually come to know every animal in their
                  care, the same way we know ours — so we can{" "}
                  <span className="text-terra">grow more, without knowing less.</span>
                </p>
              ),
            },
          ]}
        />
      </section>

      {/* ── The Save More Families Fund ── */}
      <section id="fund" className="scroll-mt-24 relative overflow-hidden bg-ember px-5 sm:px-8 py-20 sm:py-28">
        <div aria-hidden className="absolute -top-40 left-1/2 -translate-x-1/2 w-[52rem] h-[52rem] rounded-full bg-terra/25 blur-3xl" />
        <Reveal className="relative max-w-3xl mx-auto text-center text-white">
          <Eyebrow light>Give to the fund</Eyebrow>
          <h2 className="font-extrabold tracking-tight leading-tight text-4xl sm:text-6xl mb-8">
            The Save More Families Fund
          </h2>
          <p className="text-base sm:text-lg leading-relaxed text-white/80 mb-10">
            The Save More Families Fund is how that vision becomes real — and it&apos;s dedicated entirely to
            welcoming new families home, not to the daily care of the families already here. Every gift goes
            directly toward the land, training, and resources it takes to open our gates to another family after
            they&apos;ve been removed from the wild, and give them that same lifelong chance to be kept whole, roam
            freely, and hold onto their wild spirit for good. Give what you can; any amount moves us closer.
          </p>
          {GIVING.zeffy.saveMoreFamilies && (
            <ZeffyGive
              url={GIVING.zeffy.saveMoreFamilies}
              title="The Save More Families Fund"
              className="inline-flex items-center gap-2 px-9 py-4 rounded-full bg-terra text-white text-base sm:text-lg font-extrabold hover:bg-terra-light transition-colors shadow-lg shadow-black/30"
            >
              Give to the Fund <ArrowRight className="w-5 h-5" />
            </ZeffyGive>
          )}
        </Reveal>
      </section>

      {/* ── A Bigger Role: a portrait, like the photo on a letter ── */}
      <section className="bg-blush px-5 sm:px-8 py-20 sm:py-28">
        <Reveal className="max-w-2xl mx-auto text-center">
          <div className="relative mx-auto mb-10 w-56 h-56 sm:w-72 sm:h-72">
            <div className="absolute inset-0 rounded-full bg-terra/25 translate-x-3 translate-y-3" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={BIGGER_ROLE}
              alt="Sitting cheek to cheek with a burro under a big desert sky"
              loading="lazy"
              className="relative w-full h-full rounded-full object-cover shadow-xl ring-8 ring-white"
              style={{ objectPosition: "center 50%" }}
            />
          </div>
          <Eyebrow>Get involved</Eyebrow>
          <h2 className={`${heading} text-4xl sm:text-5xl mb-6`}>A Bigger Role</h2>
          <p className={body}>
            And if you&apos;d like a better understanding of the plan — to see how you might get involved, or help
            support it in a bigger way — reach out to us directly. We&apos;ll walk you through it together.
          </p>
          <a
            href={mailto}
            className="mt-8 inline-flex items-center gap-2 px-7 py-3.5 rounded-full border-2 border-terra-dark text-terra-dark text-base font-extrabold hover:bg-terra-dark hover:text-white transition-colors"
          >
            <Mail className="w-5 h-5" /> Talk to Us <ArrowRight className="w-4 h-4" />
          </a>
        </Reveal>
      </section>

      {/* ── Closing: back under the same sky ── */}
      <SkyBand minH="min-h-[75svh]" pos="center 60%">
        <Reveal className="relative max-w-4xl mx-auto px-5 sm:px-8 pt-12 sm:pt-16 pb-56 text-center">
          <p className={`text-2xl sm:text-4xl font-extrabold leading-snug ${sky}`}>
            However you take part, you&apos;re helping make sure the right to still be who they are reaches more
            than just the families already home.
          </p>
        </Reveal>
      </SkyBand>

      <NewFooter />
    </div>
  );
}
