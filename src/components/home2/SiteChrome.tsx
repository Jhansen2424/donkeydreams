// Header + footer for the redesigned (non-film) pages, matching the new
// homepage's nav and the footer spec from the approved 10/8 copy doc. The
// film homepage keeps its own overlay nav; pages using these are excluded
// from the old SiteShell chrome (see SiteShell.tsx).

import Link from "next/link";
import { MobileMenu } from "./MobileMenu";

// Never link to the old site's pages (client, 10/15). Sections without a
// redesigned page yet open the homepage film at that chapter instead.
export const FILM_CHAPTERS: Record<string, string> = {
  "their-stories": "storiesheader",
};

export const NEW_NAV = [
  { label: "Our Story", href: "/our-story" },
  { label: "Their Stories", href: "/their-stories" },
  { label: "Save More Families", href: "/save-more-families" },
  { label: "Make an Impact", href: "/donate" },
];

export function NewHeader() {
  return (
    <header className="sticky top-0 z-40 bg-cream/90 backdrop-blur border-b border-card-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
        <Link href="/" aria-label="Donkey Dreams Sanctuary — home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/DDlogo.png" alt="Donkey Dreams Sanctuary" className="h-12 sm:h-14 w-auto" />
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          {NEW_NAV.map((n) => (
            <Link
              key={n.label}
              href={n.href}
              className="text-sm font-semibold text-charcoal/80 hover:text-sky-dark transition-colors"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/donate#two-ways"
            className="shrink-0 px-4 py-2 rounded-full bg-sky text-charcoal text-sm font-extrabold hover:bg-sky-light transition-colors"
          >
            Donate Now
          </Link>
          <MobileMenu links={NEW_NAV} donateHref="/donate#two-ways" tone="dark" />
        </div>
      </div>
    </header>
  );
}

export const SOCIALS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/donkey_dreams_sanctuary/",
    bg: "bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888]",
    icon: "M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1.1.4 2.2.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1.1.4-2.2.4-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1.1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1.1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 3.1a6.7 6.7 0 1 0 0 13.4 6.7 6.7 0 0 0 0-13.4zm0 11a4.3 4.3 0 1 1 0-8.6 4.3 4.3 0 0 1 0 8.6zm6.9-11.2a1.6 1.6 0 1 1-3.2 0 1.6 1.6 0 0 1 3.2 0z",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/DonkeyDreamsSanctuary",
    bg: "bg-[#1877f2]",
    icon: "M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z",
  },
];

// Seals from the current donkeydreams.org footer; Guardian updated to the
// 2026 seal the client supplied (the old site still shows 2025).
export const SEALS = [
  { src: "/images/seals/gfas.webp", alt: "Global Federation of Animal Sanctuaries — Accredited" },
  { src: "/images/seals/candid-platinum-2026.webp", alt: "Candid Platinum Seal of Transparency 2026" },
  { src: "/images/seals/homes-for-horses.webp", alt: "Proud Member — Homes for Horses Coalition" },
  { src: "/images/seals/guardian-2026.webp", alt: "EQUUS Foundation Guardian — 2026 Approved" },
];

export function NewFooter() {
  return (
    <footer className="bg-charcoal text-white/80 border-t-4 border-sky">
      <div className="max-w-6xl mx-auto px-6 py-14 grid gap-10 md:grid-cols-4 text-sm">
        <div className="md:col-span-2 space-y-2">
          <p className="text-lg font-extrabold text-white">Donkey Dreams Sanctuary</p>
          <p className="text-white/70">Preserving the Wild Burro Spirit</p>
          <p>A GFAS-Accredited 501(c)(3) Nonprofit · EIN 81-3650509</p>
          <p>All donations are 100% tax deductible.</p>
          <div className="flex flex-wrap gap-3 pt-4">
            {SEALS.map((s) => (
              <span key={s.src} className="bg-white rounded-lg p-1.5 shadow-sm" title={s.alt}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.src} alt={s.alt} className="h-16 sm:h-20 w-auto" loading="lazy" />
              </span>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-white/50 mb-3">Explore</p>
          {[{ label: "Home", href: "/" }, ...NEW_NAV].map((n) => (
            <Link key={n.label} href={n.href} className="block hover:text-white transition-colors">
              {n.label}
            </Link>
          ))}
          <p className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-white/50 pt-4 mb-1">Governance</p>
          <p>Board of Directors</p>
          <p>Standard Operating Procedures</p>
        </div>
        <div className="space-y-2">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-white/50 mb-3">Contact</p>
          <p>
            3900 N Stockton Hill Rd, Ste B368
            <br />
            Kingman, AZ 86409
          </p>
          <a href="mailto:amber@donkeydreams.org" className="block hover:text-white transition-colors">
            amber@donkeydreams.org
          </a>
          <div className="flex gap-4 pt-2">
            <a href="https://www.instagram.com/donkey_dreams_sanctuary/" target="_blank" rel="noreferrer" className="hover:text-white">
              Instagram
            </a>
            <a href="https://www.facebook.com/DonkeyDreamsSanctuary" target="_blank" rel="noreferrer" className="hover:text-white">
              Facebook
            </a>
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-white/40 pb-8">
        © 2026 Donkey Dreams Sanctuary. All rights reserved.
      </p>
    </footer>
  );
}
