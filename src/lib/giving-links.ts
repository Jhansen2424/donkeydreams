// Every giving destination on the Make an Impact page, in one place.
// `null` = link not supplied yet; the page falls back gracefully (Patreon
// tiers fall back to the main Patreon page, Zeffy options show the other
// ways to give). Paste the real URL in and redeploy — nothing else changes.
//
// Zeffy: paste the form's normal share link (…/donation-form/<slug>); the
// page converts it to Zeffy's embed URL so checkout opens in a pop-up on our
// site instead of sending people away (client 10/14).

export const GIVING = {
  patreon: {
    page: "https://www.patreon.com/c/DonkeyDreamsSanctuary",
    // tier-specific join links (Patreon → your page → each tier → copy link)
    buddy: null as string | null, // $5
    explorer: null as string | null, // $25
    supporter: null as string | null, // $55
    bestie: null as string | null, // $75
  },
  zeffy: {
    senior: null as string | null, // Support a Senior Burro — $95/mo
    momChild: null as string | null, // Care for a Mom/Child Pair — $155/mo
    family: null as string | null, // Feed an Entire Burro Family — $357/mo
    oneTime: null as string | null, // one-time gifts, any amount
  },
  // Carried over from the previous donate page — confirm still current.
  venmo: "@DonkeyDreamsSanctuary",
  zelle: "donkeydreamssanctuary@gmail.com",
  // Address from the approved 10/8 copy doc footer (the old page listed a
  // Littlefield PO box) — confirm which one takes mailed checks.
  mail: ["Donkey Dreams Sanctuary", "3900 N Stockton Hill Rd, Ste B368", "Kingman, AZ 86432"],
};

/** Normalize any Zeffy form link to its embeddable URL (for the pop-up). */
export function zeffyEmbedUrl(url: string): string {
  if (url.includes("/embed/")) return url;
  const m = url.match(/\/(donation-form|ticketing|peer-to-peer)\/([^/?#]+)/);
  return m ? `https://www.zeffy.com/embed/${m[1]}/${m[2]}` : url;
}
