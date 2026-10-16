// ── Their Stories (/their-stories) ──
// Copy verbatim from Amber's emails of 10/15 ("Gabriel and Jack Jack's Story",
// "Xander and The Brave Herd"); photos from her Drive folders and the ones
// labeled for this page. Its own look among the redesigned pages: a
// storybook read by lamplight, night indigo with gold, each family a
// chapter with a cover and a long-read column that photos break out of.

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { NewHeader, NewFooter } from "./SiteChrome";
import { Reveal } from "./Reveal";
import { StoryTabs } from "./StoryTabs";

const S = "/images/stories";

/** Pixel sizes, so each photo's space is held before it loads. */
const DIMS: Record<string, [number, number]> = {
  "brave-1.webp": [1190, 1588],
  "brave-2.webp": [1190, 1588],
  "brave-3.webp": [1300, 996],
  "brave-4.webp": [1131, 1504],
  "brave-5.webp": [1127, 1504],
  "brave-6.webp": [2000, 1208],
  "gabe-1.webp": [512, 384],
  "gabriel-cover.webp": [2000, 1500],
  "jj-amber.webp": [1206, 1224],
  "jj-amira-jack-zara.webp": [1206, 940],
  "jj-edj-1.webp": [1178, 1440],
  "jj-edj-2.webp": [1206, 1304],
  "jj-jack-amira-zara.webp": [1206, 1574],
  "x-arrived.webp": [1197, 1592],
  "x-family.webp": [1300, 1734],
  "x-luna-grooming.webp": [2000, 1506],
  "x-luna.webp": [1193, 878],
  "x-profile.webp": [1206, 2098],
  "x-rainier-playing.webp": [1206, 1076],
};
const dims = (src: string) => DIMS[src.split("/").pop() ?? ""] ?? [4, 3];

type Img = { src: string; alt: string; portrait?: boolean; pos?: string };
type Block = string | { imgs: Img[] };
type Story = {
  id: string;
  name: string;
  cover: Img;
  card: Img;
  tagline: string;
  intro: Block[];
  sections: { title: string; blocks: Block[] }[];
};

const STORIES: Story[] = [
  {
    id: "gabriel",
    name: "Gabriel",
    cover: { src: `${S}/gabriel-cover.webp`, alt: "Gabriel on his prosthetic leg, keeping watch over two resting members of his herd", pos: "center 55%" },
    card: { src: `${S}/gabriel-cover.webp`, alt: "Gabriel", pos: "74% center" },
    tagline: "His story is proof of what a donkey family can do.",
    intro: [
      "Gabriel is the newest member of the Donkey Dreams family, and his journey here might be the most remarkable yet.",
      "As a baby in the wild, Gabriel survived alone, part of his back leg already gone. A cattle rancher found him and brought him home. Three days later, a friend connected us, and we drove hours to bring Gabriel to the vet, then home to Donkey Dreams, where he could finally get the care he needed. His body was thin and his leg was gone, and somehow, his bloodwork still came back normal. Surviving the wild, it turned out, was only the first test.",
    ],
    sections: [
      {
        title: "Ready to Belong",
        blocks: [
          "From the moment he arrived, Gabriel’s love of other donkeys was impossible to miss. He could see them, smell them, hear them — and he reached for them anyway, calling out through the fence line that stood between them. He was ready to connect, ready to belong, long before his body was ready to join them.",
          "First, though, he needed to heal: time for his leg, and weight he didn’t have yet to gain. His matted coat became something we tended to every day, brushing and cuddling him through long stretches of rest, while Gabriel did the quiet work of getting strong.",
        ],
      },
      {
        title: "Learning to Trust Again",
        blocks: [
          "Surviving the wild was the easier of Gabriel’s two journeys. Settling into life at Donkey Dreams asked something different of him — new food and water, fences where there’d been none, people where there’d been no one at all. None of it came naturally, not right away. But little by little, he began to thrive. The same daily brushing, massages, and cuddling that helped heal his body did something else too: they reminded all of us, Gabriel included, that comfort can still be found in the middle of grief.",
        ],
      },
      {
        title: "The Magic Leg",
        blocks: [
          "Then came the Magic Leg. After 75 daily bandage changes and a growth spurt that caught everyone off guard, the day finally arrived for Gabriel’s first test run on his prosthetic.",
          "He stood. Then he ran — pure joy, no hesitation, like he’d been doing it all along. Day by day he grew steadier and more confident on it, until he was ready for the next step: a herd of his own.",
        ],
      },
      {
        title: "Joining the Brave Herd",
        blocks: [
          "That herd was the Brave Herd, and joining it brought a whole new set of lessons — boundaries, friendship, how much room there is for play. Asher helped guide him through herd life, and Halo became his constant playmate; the two of them still nap, play, and then play again, the way a herd is supposed to work. For the first time since he’d arrived, Gabriel was at peace. These days, he’s even known to stand watch over the very family that welcomed him in. His story is proof of what a donkey family can do.",
          { imgs: [{ src: `${S}/gabe-1.webp`, alt: "Gabriel stretched out in the sun with his herd, his Magic Leg on" }] },
          "Gabriel’s story isn’t finished. As he keeps growing, he’ll need more Magic Legs to come — and a veterinarian who specializes in equine amputee and prosthetic care has already agreed to help plan for what he needs now, and what he’ll need down the road.",
        ],
      },
    ],
  },
  {
    id: "jack-jack",
    name: "Jack-Jack",
    cover: { src: `${S}/jj-amira-jack-zara.webp`, alt: "Jack-Jack resting with Amira and Zara", pos: "center 60%" },
    card: { src: `${S}/jj-amber.webp`, alt: "Jack-Jack", pos: "center 60%" },
    tagline: "Not every foal finds a second family waiting. Jack-Jack did.",
    intro: [
      "Jack-Jack was one of the snuggliest baby donkeys you’d ever meet. At just seven months old, though, he suddenly lost his mother — a devastating loss for such a young foal. Donkeys form incredibly deep bonds with their mothers and mates, deep enough that grief alone can turn fatal: a donkey who loses someone they love will sometimes simply stop eating, and that can lead to starvation.",
      {
        imgs: [
          { src: `${S}/jj-edj-2.webp`, alt: "Jack-Jack curled up for a cuddle with Edj", portrait: true },
          { src: `${S}/jj-amber.webp`, alt: "Jack-Jack resting in Amber’s lap", portrait: true },
        ],
      },
    ],
    sections: [
      {
        title: "A Family of His Own",
        blocks: [
          "Thankfully, Jack-Jack had a herd. Amira and her foal Zara, rescued together as part of his family group, took him in and have looked after him ever since. Without them, we’re not sure he would have made it.",
          { imgs: [{ src: `${S}/jj-jack-amira-zara.webp`, alt: "Jack-Jack with Amira and Zara, his family", portrait: true }] },
        ],
      },
      {
        title: "What a Mother Teaches",
        blocks: [
          "Amira is young herself, and her parenting style is easygoing, more so than most jennies’. Jack-Jack grew up a little more rambunctious than the other young males in the herd, whose mothers set clearer boundaries along the way. In some ways, Jack-Jack is proof of just how much young donkeys need their moms — not only to survive, but to learn how to be donkeys.",
          "Jack-Jack’s story is also a reminder of how much is at stake when a young burro loses their mother. Not every foal finds a second family waiting. Jack-Jack did.",
          { imgs: [{ src: `${S}/jj-edj-1.webp`, alt: "Jack-Jack napping beside Edj while the herd looks on", portrait: true }] },
        ],
      },
    ],
  },
  {
    id: "xander",
    name: "Xander",
    cover: { src: `${S}/x-luna-grooming.webp`, alt: "Xander and Luna grooming each other", pos: "center 62%" },
    card: { src: `${S}/x-profile.webp`, alt: "Xander", pos: "center 45%" },
    tagline: "It’s hard not to feel it too: he’s exactly where he belongs.",
    intro: [
      "Xander and Luna were mates at a breeder in Texas, and had a son together: Rainier. Like most breeders, this one used Xander to sire foals with multiple females — which is how he also became father to Olaf, born to another female at the breeder, Maku.",
      { imgs: [{ src: `${S}/x-luna.webp`, alt: "Xander and Luna, side by side again" }] },
    ],
    sections: [
      {
        title: "Getting Luna and Maku Home",
        blocks: [
          "When the breeder began sending mares to slaughter auction, we were able to step in and rescue Luna, Maku, and their foals, bringing all four home to Donkey Dreams. Luna arrived pregnant as well, with Rainier already at her side.",
        ],
      },
      {
        title: "Left Behind",
        blocks: [
          "Xander wasn’t so fortunate. Months later, the breeder closed its doors and dropped all 65+ of its remaining donkeys — Xander among them — at that same slaughter auction in Bowie. We tried to get him out too, but we couldn’t. Instead, he entered the slaughter auction circuit, cycled from buyer to buyer by people looking to profit from donkeys, given just enough care to keep him sellable. That was his life for an entire year, separated from Luna and from both of his sons, who were growing up safe at Donkey Dreams without him.",
        ],
      },
      {
        title: "Found Again",
        blocks: [
          "We thought we had lost Xander for good. Then a local Texas donkey rescue pulled him from a slaughter auction, and that’s where we found him again. Thanks to their compassion and persistence, Xander finally made it to where he belonged — home, with Luna and the two sons he’d never had the chance to know.",
          { imgs: [{ src: `${S}/x-arrived.webp`, alt: "Xander the day he arrived at Donkey Dreams", portrait: true }] },
        ],
      },
      {
        title: "Finding His Place",
        blocks: [
          "Reuniting them was only the first step. In the time Xander had been gone, Rainier had grown into a nearly two-year-old and become the herd’s male lead, building his own relationships with the females. So the father arriving to join the herd his own son now led — bigger, more mature, and previously used for breeding himself — meant the integration had to be slow, methodical, and careful. Every day through that process, we spent one-on-one time with Xander, giving him the human connection and reassurance he needed while he found his place.",
          { imgs: [{ src: `${S}/x-rainier-playing.webp`, alt: "Xander and his son Rainier playing" }] },
          "Today, that patience has paid off. Xander is fully part of his family — bonded again with his mate Luna, alongside both of his sons, Rainier and Olaf, and the rest of the herd. A father who was torn from Luna and from both of his boys before he ever really knew them now shares a home with all three. It’s hard not to feel it too: he’s exactly where he belongs.",
          {
            imgs: [
              { src: `${S}/x-family.webp`, alt: "Xander with his family in the shade", portrait: true },
              { src: `${S}/x-profile.webp`, alt: "Xander today, at home", portrait: true },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "brave-herd",
    name: "The Brave Herd",
    cover: { src: `${S}/brave-6.webp`, alt: "The Brave Herd together in the evening light", pos: "center 55%" },
    card: { src: `${S}/brave-1.webp`, alt: "The Brave Herd", pos: "center 30%" },
    tagline: "Trust isn’t something we can schedule or predict. It’s something we wait for.",
    intro: [
      "When the Brave Herd arrived at Donkey Dreams, they were some of the most terrified wild burros we’d ever met — and after years of working with hundreds of burros, that’s saying something.",
      { imgs: [{ src: `${S}/brave-1.webp`, alt: "The Brave Herd gathered at the hay feeder", portrait: true }] },
    ],
    sections: [
      {
        title: "Running From the Room",
        blocks: [
          "We placed them in a part of the sanctuary where they’d be around us often, but never have to interact with us. Even so, anytime we stepped into their space to feed them or just be near them, they ran to the corner — whether or not we were anywhere close to them, whether or not we were even looking their way. It took a couple of months before they stopped running at all.",
        ],
      },
      {
        title: "Merida Breaks the Mold",
        blocks: [
          "Then, slowly, they decided not to run anymore. And one day, one of them — Merida — decided to do more than that: she chose to interact with us, and in doing so, showed the rest of her herd it was safe. From there, each donkey came around in their own time, at their own pace. It took Merida breaking the mold first. We named her after Merida from Brave for exactly that reason.",
          {
            imgs: [
              { src: `${S}/brave-2.webp`, alt: "Nose to nose with one of the Brave Herd", portrait: true },
              { src: `${S}/brave-4.webp`, alt: "A quiet moment with one of the Brave Herd’s moms", portrait: true },
            ],
          },
          "Interestingly, with most herds, the babies come around to trust us before their mothers do. With the Brave Herd, it happened the other way — the moms led the way first. If anything, that just proves the point: trust isn’t something we can schedule or predict. It’s something we wait for, and let them give on their own terms.",
        ],
      },
      {
        title: "Care Without a Halter",
        blocks: [
          "These days, trust shows up in how we care for them. The Brave Herd carries some genetics that bring a few more challenges than most of our other herds — hoof issues, eyesight issues, and autoimmune issues among them — which means they actually need more hands-on care than almost anyone else on the sanctuary. And yet none of that care requires a halter or any kind of restraint. We simply work with them while they stand there, because they trust us — emphatically, organically, authentically.",
          { imgs: [{ src: `${S}/brave-3.webp`, alt: "Edj resting beside a sleeping foal from the Brave Herd" }] },
          "That trust built something rare: three generations of the same family, still living together today. New members join them too — when Gabriel came home, it was Asher who showed him how herd life worked, and Halo who became his closest friend. Now, the Brave Herd are some of the most affectionate, trusting donkeys on the sanctuary — living proof of what patience, compassion, and kindness can do.",
          { imgs: [{ src: `${S}/brave-5.webp`, alt: "Two young members of the Brave Herd", portrait: true }] },
        ],
      },
    ],
  },
];

const prose = "text-[17px] sm:text-lg leading-[1.85] text-charcoal/80";

function Figure({ imgs }: { imgs: Img[] }) {
  if (imgs.length > 1) {
    return (
      <Reveal className="my-12 sm:my-14 -mx-1 sm:-mx-16 lg:-mx-40 grid grid-cols-2 gap-3 sm:gap-6">
        {imgs.map((im) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={im.src}
            src={im.src}
            alt={im.alt}
            loading="lazy"
            className="w-full aspect-[4/5] object-cover rounded-2xl sm:rounded-3xl shadow-lg"
            style={{ objectPosition: im.pos ?? "center" }}
          />
        ))}
      </Reveal>
    );
  }
  const im = imgs[0];
  return (
    // portraits stay column-sized; small originals stay sharp instead of
    // stretching to the wide break-out
    <Reveal
      className={`my-12 sm:my-14 ${
        im.portrait ? "max-w-md mx-auto" : dims(im.src)[0] < 900 ? "max-w-xl mx-auto" : "-mx-1 sm:-mx-16 lg:-mx-40"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={im.src} alt={im.alt} width={dims(im.src)[0]} height={dims(im.src)[1]} loading="lazy" className="w-full h-auto rounded-2xl sm:rounded-3xl shadow-lg" />
    </Reveal>
  );
}

function Blocks({ blocks, dropCap }: { blocks: Block[]; dropCap?: boolean }) {
  let firstText = dropCap;
  return (
    <>
      {blocks.map((b, i) => {
        if (typeof b !== "string") return <Figure key={i} imgs={b.imgs} />;
        const cap = firstText;
        firstText = false;
        return (
          <p
            key={i}
            className={`${prose} mb-6 ${
              cap
                ? "first-letter:float-left first-letter:text-[4.6rem] first-letter:leading-[0.8] first-letter:font-extrabold first-letter:text-gold-dark first-letter:mr-3 first-letter:mt-2"
                : ""
            }`}
          >
            {b}
          </p>
        );
      })}
    </>
  );
}

function StoryChapter({ story, n, next }: { story: Story; n: number; next?: Story }) {
  return (
    <section id={story.id} className={`scroll-mt-32 sm:scroll-mt-36 px-4 sm:px-8 pt-12 sm:pt-16 pb-16 sm:pb-24 ${n % 2 ? "bg-white" : "bg-parchment"}`}>
      {/* the cover */}
      <Reveal className="relative max-w-6xl mx-auto rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl aspect-[4/5] sm:aspect-[16/10] lg:aspect-[2/1]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={story.cover.src}
          alt={story.cover.alt}
          loading={n === 0 ? undefined : "lazy"}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: story.cover.pos ?? "center" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-night/90 via-night/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 lg:p-14">
          <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-gold-light mb-3">
            Story {String(n + 1).padStart(2, "0")}
          </p>
          <h2 className="font-extrabold tracking-tight leading-none text-white text-5xl sm:text-7xl lg:text-8xl mb-4 sm:mb-5">
            {story.name}
          </h2>
          <p className="max-w-2xl text-lg sm:text-2xl font-semibold leading-snug text-white/90">{story.tagline}</p>
        </div>
      </Reveal>

      {/* the long read */}
      <div className="max-w-2xl mx-auto pt-12 sm:pt-16">
        <Reveal>
          <Blocks blocks={story.intro} dropCap />
        </Reveal>
        {story.sections.map((sec) => (
          <div key={sec.title} className="mt-10 sm:mt-12">
            <Reveal>
              <div className="flex items-center gap-4 mb-5">
                <span className="h-px w-8 bg-gold" />
                <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-night">{sec.title}</h3>
              </div>
            </Reveal>
            <Blocks blocks={sec.blocks} />
          </div>
        ))}

        {next && (
          <Reveal className="mt-14">
            <a
              href={`#${next.id}`}
              className="group flex items-center justify-between gap-4 rounded-2xl border border-gold/30 bg-night px-6 py-5 text-white hover:bg-night-light transition-colors"
            >
              <span>
                <span className="block text-[11px] font-extrabold uppercase tracking-[0.28em] text-gold-light">Next story</span>
                <span className="block text-xl sm:text-2xl font-extrabold">{next.name}</span>
              </span>
              <ArrowRight className="w-6 h-6 text-gold transition-transform group-hover:translate-x-1" />
            </a>
          </Reveal>
        )}
      </div>
    </section>
  );
}

function Button({ href, children, solid }: { href: string; children: ReactNode; solid?: boolean }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-base font-extrabold transition-colors ${
        solid ? "bg-gold text-night hover:bg-gold-light" : "border-2 border-gold/60 text-white hover:bg-white/10"
      }`}
    >
      {children} <ArrowRight className="w-4 h-4" />
    </Link>
  );
}

export default function TheirStoriesPage() {
  return (
    <div className="bg-parchment text-charcoal">
      <NewHeader />

      {/* ── Hero: the four families as a storybook's contents ── */}
      <section className="relative overflow-hidden bg-night px-5 sm:px-8 pt-16 sm:pt-24 pb-14 sm:pb-20">
        <div aria-hidden className="absolute -top-48 left-1/2 -translate-x-1/2 w-[60rem] h-[44rem] rounded-full bg-gold/15 blur-3xl" />
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <p className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.3em] text-gold-light mb-5">Donkey Dreams Sanctuary</p>
            <h1 className="font-extrabold tracking-tight leading-none text-white text-5xl sm:text-7xl lg:text-8xl">Their Stories</h1>
            <span className="block w-24 h-1.5 rounded-full bg-gradient-to-r from-gold-light to-gold mx-auto mt-8 mb-8" />
            <p className="text-xl sm:text-2xl font-semibold text-white/85">Every burro, every family has a story.</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {STORIES.map((s, i) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="group relative block rounded-2xl sm:rounded-3xl overflow-hidden aspect-[3/4] shadow-xl ring-1 ring-white/10"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.card.src}
                  alt={s.card.alt}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  style={{ objectPosition: s.card.pos ?? "center" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-night/90 via-night/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
                  <p className="text-[11px] font-extrabold tracking-[0.25em] text-gold-light">{String(i + 1).padStart(2, "0")}</p>
                  <p className="text-lg sm:text-2xl font-extrabold text-white leading-tight">{s.name}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <StoryTabs stories={STORIES.map(({ id, name }) => ({ id, name }))} />

      {STORIES.map((s, i) => (
        <StoryChapter key={s.id} story={s} n={i} next={STORIES[i + 1]} />
      ))}

      {/* ── Closing ── */}
      <section className="relative overflow-hidden bg-night px-5 sm:px-8 py-20 sm:py-28 text-center">
        <div aria-hidden className="absolute -bottom-48 left-1/2 -translate-x-1/2 w-[56rem] h-[40rem] rounded-full bg-gold/15 blur-3xl" />
        <Reveal className="relative max-w-3xl mx-auto">
          <p className="text-3xl sm:text-5xl font-extrabold leading-tight text-white mb-10">
            Every burro, every family has a story.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Button href="/save-more-families" solid>
              Save More Families
            </Button>
            <Button href="/donate">Make an Impact</Button>
          </div>
        </Reveal>
      </section>

      <NewFooter />
    </div>
  );
}
