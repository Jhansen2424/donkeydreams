// ── Our Story (/our-story) ──
// Copy verbatim from the client's Our Story doc (10/15). Juniper greens are
// this page's accent, the way sunset orange is Make an Impact's.
// Photos arrive named by section: save each as
// public/images/our-story/<key>.webp and point PHOTOS[key] at it. Until then
// inline spots show a labeled placeholder, and the full-bleed sections use a
// stand-in from the homepage film.

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Feather, MapPin, Mountain, Users } from "lucide-react";
import { NewHeader, NewFooter, SOCIALS } from "./SiteChrome";
import { Reveal } from "./Reveal";

const heading = "font-extrabold tracking-tight leading-tight text-charcoal";
const body = "text-warm-gray text-base sm:text-lg leading-relaxed";

const PHOTOS: Record<string, string | null> = {
  hero: null,
  "first-spark": null,
  calling: null,
  family: "/images/our-story/family.webp",
  "pink-and-eli": "/images/our-story/pink-and-eli.webp",
  eli: "/images/our-story/eli.webp",
  "five-years": null,
  "donkey-joy": null,
  "family-by-family": "/images/our-story/family-by-family.webp",
  "move-home": "/images/our-story/move-home.webp",
};

const STAND_IN: Record<string, string> = {
  hero: "/images/film/pano-ridge-golden.webp",
  "move-home": "/images/film/pano-hillside-herd.webp",
};

const bg = (key: string) => PHOTOS[key] ?? STAND_IN[key];

function Photo({
  k,
  label,
  alt,
  pos = "center",
  className = "",
}: {
  k: string;
  label: string;
  alt: string;
  pos?: string;
  className?: string;
}) {
  const src = PHOTOS[k];
  return (
    <div className={`relative ${className}`}>
      {/* offset juniper block behind the frame */}
      <div className="absolute inset-0 translate-x-3 translate-y-3 sm:translate-x-4 sm:translate-y-4 rounded-[2rem] bg-juniper/25" />
      <div className="relative h-full rounded-[2rem] overflow-hidden shadow-xl bg-mist">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} loading="lazy" className="w-full h-full object-cover" style={{ objectPosition: pos }} />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center bg-gradient-to-br from-mist via-cream to-juniper-light/40">
            <span className="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center">
              <Feather className="w-5 h-5 text-juniper-dark" />
            </span>
            <p className="text-[11px] font-bold uppercase tracking-wider text-charcoal/55">Photo · {label}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ChapterMark({ n, place, light }: { n: number; place?: string; light?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
      <span className={`text-xs font-extrabold uppercase tracking-[0.28em] ${light ? "text-juniper-light" : "text-juniper-dark"}`}>
        Chapter {String(n).padStart(2, "0")}
      </span>
      <span className={`h-px w-10 ${light ? "bg-juniper-light/50" : "bg-juniper/40"}`} />
      {place && (
        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${light ? "text-white/60" : "text-warm-gray"}`}>
          <MapPin className="w-3.5 h-3.5" />
          {place}
        </span>
      )}
    </div>
  );
}

/** Photo on one side, chapter text on the other; `flip` swaps sides on desktop. */
function Chapter({
  n,
  title,
  place,
  photo,
  flip,
  className = "",
  children,
}: {
  n: number;
  title: string;
  place?: string;
  photo: { k: string; label: string; alt: string; pos?: string };
  flip?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`px-5 sm:px-8 py-16 sm:py-24 ${className}`}>
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <Reveal className={flip ? "lg:order-2" : ""}>
          <Photo {...photo} className="aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5] mr-3 sm:mr-4" />
        </Reveal>
        <Reveal delay={120}>
          <ChapterMark n={n} place={place} />
          <h2 className={`${heading} text-3xl sm:text-5xl mb-6`}>{title}</h2>
          <div className="space-y-5">{children}</div>
        </Reveal>
      </div>
    </section>
  );
}

function PullQuote({ children }: { children: ReactNode }) {
  return (
    <blockquote className="relative pl-6 my-8 border-l-4 border-juniper">
      <p className="text-xl sm:text-2xl font-bold leading-snug text-juniper-dark">{children}</p>
    </blockquote>
  );
}

function Pill({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 mx-1 my-1 px-4 py-1.5 rounded-full bg-juniper text-white text-sm font-extrabold align-middle hover:bg-juniper-dark transition-colors"
    >
      {children} <ArrowRight className="w-3.5 h-3.5" />
    </Link>
  );
}

const PILLARS = [
  { icon: Users, title: "Family kept whole" },
  { icon: Mountain, title: "Room to roam" },
  { icon: Feather, title: "The right to still be who they are" },
];

export default function OurStoryPage() {
  return (
    <div className="bg-cream text-charcoal">
      <NewHeader />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden min-h-[78svh] flex items-end">
        <div
          className="absolute inset-0 bg-cover"
          style={{ backgroundImage: `url(${bg("hero")})`, backgroundPosition: "center 45%" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-juniper-deep via-juniper-deep/60 to-juniper-deep/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-juniper-deep/60 via-juniper-deep/20 to-transparent" />
        <div className="relative w-full max-w-6xl mx-auto px-5 sm:px-8 pb-14 sm:pb-20 pt-40">
          <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-white/85 mb-4">
            Donkey Dreams Sanctuary
          </p>
          <h1 className="font-extrabold tracking-tight leading-none text-white text-5xl sm:text-7xl lg:text-8xl mb-6">
            Our Story
          </h1>
          <span className="block w-24 h-1.5 rounded-full bg-gradient-to-r from-juniper-light to-juniper mb-8" />
          <p className="max-w-3xl text-lg sm:text-2xl leading-relaxed text-white/90">
            At Donkey Dreams, everything we do comes back to one thing: preserving the wild burro spirit
            by keeping families whole, giving them room to roam, and honoring their right to still be who
            they are, even in our care.
          </p>
        </div>
      </section>

      {/* ── The three things it all comes back to ── */}
      <section className="bg-juniper-deep px-5 sm:px-8 py-12 sm:py-14">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-3 gap-8">
          {PILLARS.map(({ icon: Icon, title }, i) => (
            <Reveal key={title} delay={i * 120} className="flex items-center gap-4">
              <span className="shrink-0 w-12 h-12 rounded-full border border-juniper-light/40 bg-juniper/20 flex items-center justify-center">
                <Icon className="w-5 h-5 text-juniper-light" />
              </span>
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-juniper-light/70">
                  0{i + 1}
                </p>
                <p className="text-lg sm:text-xl font-extrabold text-white leading-snug">{title}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <Chapter
        n={1}
        title="The First Spark"
        place="Park City, Utah"
        photo={{ k: "first-spark", label: "The First Spark", alt: "Wild mustangs in the high desert" }}
      >
        <p className={body}>
          We felt that spirit for the first time years before Donkey Dreams existed, standing in the high
          desert at a wild mustang sanctuary in Park City, Utah. Co-Founders Edj Fish and Amber Raleigh went
          there as volunteers, and left with something neither of us expected — a kind of reverence for what
          it means to watch a wild animal simply be itself. We didn&apos;t know it yet, but that feeling would
          end up shaping the rest of our lives. It&apos;s what solidified our vision to preserve the wild burro
          spirit, long before we knew what that vision would actually look like.
        </p>
        <PullQuote>A kind of reverence for what it means to watch a wild animal simply be itself.</PullQuote>
      </Chapter>

      <Chapter
        n={2}
        title="The Calling"
        flip
        className="bg-white"
        photo={{ k: "calling", label: "The Calling", alt: "Burros in the open desert" }}
      >
        <p className={body}>
          We assumed, naturally, that if we ever opened a sanctuary of our own, it would be for horses. But
          little did we know it would be burros. To this day, neither of us remembers whose idea it was, or
          the exact moment it happened — only that it felt immediate, and it felt like a calling: to open a
          sanctuary that could help as many burros as possible hold onto their wild spirit after being
          removed from the wild. We packed up our life and moved to the desert, giving ourselves five years
          to find the land and bring that calling to life.
        </p>
      </Chapter>

      <Chapter
        n={3}
        title="What We Learned About Family"
        photo={{ k: "family", label: "What We Learned About Family", alt: "A smiling selfie with two fuzzy young burros at the rescue", pos: "center 30%" }}
      >
        <p className={body}>
          Not long after, we found a wild burro rescue nearby and started working there. Burro families came
          through again and again, and watching them is what changed something in us — the way a mother
          stayed close to her baby, the way that bond held no matter what else was going on around them.
          We&apos;d suspected family mattered. Watching it up close is what made us certain.
        </p>
      </Chapter>

      {/* ── Pink and Eli: the family that started it all ── */}
      <section className="bg-mist border-y border-mist-border px-5 sm:px-8 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center max-w-3xl mx-auto mb-12">
            <div className="flex justify-center">
              <ChapterMark n={4} place="Born at the rescue" />
            </div>
            <h2 className={`${heading} text-4xl sm:text-6xl mb-5`}>Pink and Eli</h2>
            <p className="text-2xl sm:text-3xl font-bold text-juniper-dark">Then came Pink and Eli.</p>
          </Reveal>
          <div className="grid lg:grid-cols-5 gap-10 lg:gap-14 items-center">
            {/* two portrait frames, staggered */}
            <Reveal className="lg:col-span-3 grid grid-cols-2 gap-5 sm:gap-8 items-start">
              <Photo
                k="pink-and-eli"
                label="Pink and Eli"
                alt="Pink and Eli as foals, standing side by side at the gate"
                className="aspect-[3/4] mr-3 sm:mr-4"
              />
              <Photo
                k="eli"
                label="Eli"
                alt="Baby Eli getting a hug at the rescue"
                pos="center 40%"
                className="aspect-[3/4] mr-3 sm:mr-4 mt-12 sm:mt-20"
              />
            </Reveal>
            <Reveal delay={120} className="lg:col-span-2 space-y-8">
              <p className={body}>
                They were born at the rescue. Pink&apos;s mom, Sandy, needed extra time to bond with her — so
                Rizzo, Eli&apos;s mom, stepped in and nursed Pink too, the two mothers sharing the job between
                them until Sandy was ready. We watched it happen, two mothers quietly caring for one family
                together, and it was impossible not to feel the weight of what family really meant to these
                animals — not an idea anymore, but something we&apos;d seen with our own eyes.
              </p>
              <FamilyTree />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Five Years Became One ── */}
      <section className="bg-juniper-deep text-white px-5 sm:px-8 py-16 sm:py-24 overflow-hidden">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <Reveal>
            <ChapterMark n={5} place="Scenic, Arizona" light />
            <h2 className="font-extrabold tracking-tight leading-tight text-3xl sm:text-5xl mb-8">
              Five Years Became One
            </h2>
            <div className="flex items-end gap-5 sm:gap-8 mb-10" aria-hidden>
              <div className="text-center">
                <p className="relative text-7xl sm:text-9xl font-extrabold leading-none text-white/20">
                  5
                  <span className="absolute left-0 right-0 top-1/2 h-1.5 sm:h-2 -rotate-12 rounded-full bg-juniper-light/70" />
                </p>
                <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-white/40">years planned</p>
              </div>
              <ArrowRight className="w-8 h-8 sm:w-10 sm:h-10 text-juniper-light mb-10 sm:mb-14" />
              <div className="text-center">
                <p className="text-8xl sm:text-[10rem] font-extrabold leading-none text-juniper-light">1</p>
                <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-juniper-light/80">year it took</p>
              </div>
            </div>
            <p className="text-base sm:text-lg leading-relaxed text-white/80">
              Pink and Eli inspired us to buy land of our own in Kingman, Arizona. We were looking for a home
              for our family — and, we hoped, eventually more families too. Then the ranch next door to the
              rescue, in Scenic, came up for sale, and we looked at each other and knew. Five years became
              one. We opened Donkey Dreams there six months later — with Pink, Eli, and their two mothers as
              our very first family. The Kingman land stayed ours too: a quiet, just-in-case plan for whatever
              came next.
            </p>
          </Reveal>
          <Reveal delay={150}>
            <Photo
              k="five-years"
              label="Five Years Became One"
              alt="The first sanctuary ranch in Scenic, Arizona"
              className="aspect-[4/5] mr-3 sm:mr-4"
            />
          </Reveal>
        </div>
      </section>

      {/* ── Spreading Donkey Joy ── */}
      <section className="px-5 sm:px-8 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <Reveal>
            <Photo
              k="donkey-joy"
              label="Spreading Donkey Joy"
              alt="A donkey sharing a joyful moment with a visitor"
              className="aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5] mr-3 sm:mr-4"
            />
          </Reveal>
          <Reveal delay={120}>
            <ChapterMark n={6} />
            <h2 className={`${heading} text-3xl sm:text-5xl mb-6`}>Spreading Donkey Joy</h2>
            <div className="space-y-5">
              <p className={body}>
                From the beginning, though, our hope has reached beyond giving donkeys a home: we want people
                to fall in love with donkeys and wild burros, the way we did. We want them to feel the peace,
                the calm, the joy, even the silliness — and the quiet, surprising love donkeys have for each
                other, and for us.
              </p>
              <p className={body}>
                As a private sanctuary, we can&apos;t open our gates to everyone. But we can still spread that
                joy. Follow along on social media for everyday moments with the herd. Join Herd Insider for a
                closer look — behind-the-scenes photos, stories, and live moments, straight from the
                sanctuary. <Pill href="/donate#herd-insider">Herd Insider</Pill> Or become part of the Burro
                Family Circle, where your support goes directly to one family&apos;s care.{" "}
                <Pill href="/donate#family-circle">Burro Family Circle</Pill> Spreading that joy is just as
                much our mission as caring for the herd itself.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 mt-8">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full text-white text-sm font-extrabold shadow-md hover:scale-[1.04] transition-transform ${s.bg}`}
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden>
                    <path d={s.icon} />
                  </svg>
                  {s.label}
                </a>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <Chapter
        n={7}
        title="Family by Family"
        flip
        className="bg-white"
        photo={{ k: "family-by-family", label: "Family by Family", alt: "A burro family stepping out of the trailer together", pos: "center 72%" }}
      >
        <p className={body}>
          Year after year, more families found their way to us — some still carrying that same wild spirit,
          others domestic donkeys who&apos;d been surrendered and simply needed somewhere safe to land. Donkey
          Dreams kept growing the way it always had: one family, one bond, at a time.
        </p>
        <PullQuote>One family, one bond, at a time.</PullQuote>
      </Chapter>

      {/* ── The Move Home: full-bleed ── */}
      <section className="relative overflow-hidden px-5 sm:px-8 py-20 sm:py-32">
        <div
          className="absolute inset-0 bg-cover"
          style={{ backgroundImage: `url(${bg("move-home")})`, backgroundPosition: "25% center" }}
        />
        {/* the pair stands left of center, so the text sits on the right */}
        <div className="absolute inset-0 bg-juniper-deep/70 lg:bg-transparent lg:bg-gradient-to-l lg:from-juniper-deep/95 lg:via-juniper-deep/75 lg:to-juniper-deep/10" />
        <div className="relative max-w-6xl mx-auto">
          <Reveal className="max-w-2xl lg:max-w-xl lg:ml-auto text-white">
            <ChapterMark n={8} place="Scenic to Kingman, Arizona" light />
            <h2 className="font-extrabold tracking-tight leading-tight text-3xl sm:text-5xl mb-8">The Move Home</h2>
            <div className="space-y-5 text-base sm:text-lg leading-relaxed text-white/85">
              <p>
                We held onto that Kingman land for four years — a safety net in case of an emergency, and just
                as much a welcome option if growth ever called for more room. Eventually, it was the emergency
                that caught up with us first: the neighborhood around the Scenic sanctuary had changed quickly,
                and it was no longer the peaceful place our donkeys needed. So we made the move: the entire
                sanctuary, relocated to the Kingman land.
              </p>
              <p>
                It was a massive undertaking. Edj Fish and Amber Raleigh drove every single donkey themselves,
                keeping each family and herd together along the way to make the move as calm and peaceful as
                possible. We knew the land in Kingman would mean more room to roam, more of the wild burro
                habitat they were accustomed to — and that&apos;s what made all of it worth doing.
              </p>
            </div>
            {/* the route */}
            <div className="mt-10 flex items-center gap-3 sm:gap-4" aria-hidden>
              <span className="inline-flex items-center gap-1.5 text-sm font-extrabold">
                <MapPin className="w-4 h-4 text-juniper-light" /> Scenic
              </span>
              <span className="flex-1 max-w-xs border-t-2 border-dashed border-juniper-light/60" />
              <span className="inline-flex items-center gap-1.5 text-sm font-extrabold">
                <MapPin className="w-4 h-4 text-juniper-light" /> Kingman
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── The Same Way We Started ── */}
      <section className="px-5 sm:px-8 py-16 sm:py-24">
        <Reveal className="max-w-3xl mx-auto">
          <ChapterMark n={9} />
          <h2 className={`${heading} text-3xl sm:text-5xl mb-6`}>The Same Way We Started</h2>
          <p className={body}>
            That&apos;s the pattern we&apos;ve watched play out again and again since the very beginning: a need
            shows up, often with no time to spare, and it lines up with what we already know is right — for our
            mission, and for our hearts. So we take the step before we know exactly how it&apos;ll come
            together, and somehow, every time, the pieces find their way into place faster than anyone plans
            for — these days, often through the people who&apos;ve fallen in love with donkeys, and who share
            that same reverence for preserving the wild burro spirit, right along with us. Four years in,
            Donkey Dreams is still growing the same way it started — one family at a time, rooted in the same
            thing that brought us here in the first place: family kept whole, room to roam, and the right to
            still be who they are.
          </p>
        </Reveal>
      </section>

      {/* ── Closing: the next family ── */}
      <section className="relative overflow-hidden bg-juniper-deep px-5 sm:px-8 py-20 sm:py-28 text-center">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[46rem] h-[46rem] rounded-full bg-juniper/15 blur-3xl" />
        <Reveal className="relative max-w-3xl mx-auto">
          <p className="text-2xl sm:text-4xl font-extrabold leading-snug text-white mb-8">
            There are more families out there right now who need exactly that same chance Pink and Eli got.
          </p>
          <p className="text-lg sm:text-xl text-white/75 mb-10">
            Here&apos;s how we&apos;re working to reach them — and how you can help.
          </p>
          <Link
            href="/how-to-help"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-juniper-light text-juniper-deep text-base font-extrabold hover:bg-white transition-colors shadow-lg shadow-black/20"
          >
            Save More Families <ArrowRight className="w-4 h-4" />
          </Link>
        </Reveal>
      </section>

      <NewFooter />
    </div>
  );
}

/** Pink & Eli's family, drawn: each foal under their own mother, plus the
 *  line that made the story — Rizzo nursing Pink too. */
function FamilyTree() {
  const chip = "absolute -translate-x-1/2 -translate-y-1/2 text-center rounded-2xl px-3 py-2 shadow-sm";
  return (
    <figure className="relative w-full max-w-sm mx-auto lg:mx-0 aspect-[10/7]">
      <svg viewBox="0 0 400 280" className="absolute inset-0 w-full h-full" aria-hidden>
        <line x1="100" y1="70" x2="100" y2="210" className="stroke-juniper" strokeWidth="3" />
        <line x1="300" y1="70" x2="300" y2="210" className="stroke-juniper" strokeWidth="3" />
        <line x1="300" y1="70" x2="100" y2="210" className="stroke-juniper-dark" strokeWidth="3" strokeDasharray="8 8" />
      </svg>
      <div className={`${chip} left-1/4 top-[25%] bg-white`}>
        <p className="font-extrabold text-charcoal">Sandy</p>
        <p className="text-[11px] text-warm-gray">Pink&apos;s mom</p>
      </div>
      <div className={`${chip} left-3/4 top-[25%] bg-white`}>
        <p className="font-extrabold text-charcoal">Rizzo</p>
        <p className="text-[11px] text-warm-gray">Eli&apos;s mom</p>
      </div>
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-juniper-dark text-white text-[11px] font-bold px-2.5 py-1 whitespace-nowrap">
        nursed Pink too
      </span>
      <div className={`${chip} left-1/4 top-[75%] bg-juniper text-white`}>
        <p className="font-extrabold">Pink</p>
      </div>
      <div className={`${chip} left-3/4 top-[75%] bg-juniper text-white`}>
        <p className="font-extrabold">Eli</p>
      </div>
      <figcaption className="sr-only">
        Sandy is Pink&apos;s mother and Rizzo is Eli&apos;s mother; Rizzo also nursed Pink.
      </figcaption>
    </figure>
  );
}
