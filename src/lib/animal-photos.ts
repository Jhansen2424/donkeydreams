// Donkey photos uploaded in the app are stored inside the Animal row as data
// URLs (profileImage, galleryImages). Sending those with every /api/animals
// load meant ~3 MB, uncached, each time the staff app opened: slow on the
// yard's cell signal and a battery drain (client 10/22, Michelle's phone).
//
// So the list API swaps each stored photo for a short URL
// (/api/animals/photo?slug=…&v=<md5>) that the photo route serves once and
// phones cache for good (the md5 changes whenever the photo does). When the
// app saves a gallery list back, those URLs are turned back into the stored
// photos, so a save can never overwrite photos with links to themselves.

import { createHash } from "crypto";
import { db } from "@/lib/db";

export const md5 = (s: string) => createHash("md5").update(s, "utf8").digest("hex");

export const photoUrl = (slug: string, hash: string) =>
  `/api/animals/photo?slug=${encodeURIComponent(slug)}&v=${hash}`;

const isStored = (v: string) => v.startsWith("data:");

const REF = /^\/api\/animals\/photo\?slug=[^&]+&v=([0-9a-f]{32})$/;

/** A stored (data URL) photo becomes its short URL; paths and links pass through. */
export function publicImage(slug: string, value: string): string {
  return isStored(value) ? photoUrl(slug, md5(value)) : value;
}

/** Every animal's photo URLs, hashed in the database so the photo data
 *  itself never leaves it. */
export async function photoRefsBySlug(): Promise<Map<string, { profile: string | null; gallery: string[] }>> {
  const rows = await db.$queryRaw<{ slug: string; p: string | null; g: string[] | null }[]>`
    SELECT slug,
      CASE WHEN "profileImage" LIKE 'data:%' THEN 'h:' || md5("profileImage") ELSE "profileImage" END AS p,
      ARRAY(
        SELECT CASE WHEN x LIKE 'data:%' THEN 'h:' || md5(x) ELSE x END
        FROM unnest("galleryImages") WITH ORDINALITY AS u(x, ord) ORDER BY ord
      ) AS g
    FROM "Animal"`;
  const out = new Map<string, { profile: string | null; gallery: string[] }>();
  const fix = (slug: string, v: string) => (v.startsWith("h:") ? photoUrl(slug, v.slice(2)) : v);
  for (const r of rows) {
    out.set(r.slug, {
      profile: r.p ? fix(r.slug, r.p) : null,
      gallery: (r.g ?? []).map((v) => fix(r.slug, v)),
    });
  }
  return out;
}

/** The stored photo (data URL) for a slug + md5, or null. */
export async function storedPhoto(slug: string, hash: string): Promise<string | null> {
  const row = await db.animal.findUnique({
    where: { slug },
    select: { profileImage: true, galleryImages: true },
  });
  if (!row) return null;
  for (const v of [row.profileImage, ...row.galleryImages]) {
    if (v && isStored(v) && md5(v) === hash) return v;
  }
  return null;
}

/**
 * For a PATCH, in place: turn photo URLs the app sent back into the stored
 * photos they stand for. A profileImage that is just its own URL is removed
 * from the update (unchanged); unknown photo URLs are dropped.
 */
export async function resolvePhotoRefs(
  name: string,
  update: Record<string, unknown>
): Promise<void> {
  const touchesProfile = typeof update.profileImage === "string" && REF.test(update.profileImage);
  const gallery = Array.isArray(update.galleryImages) ? (update.galleryImages as unknown[]) : null;
  const touchesGallery = gallery?.some((v) => typeof v === "string" && REF.test(v)) ?? false;
  if (!touchesProfile && !touchesGallery) return;

  const row = await db.animal.findUnique({
    where: { name },
    select: { profileImage: true, galleryImages: true },
  });
  const byHash = new Map<string, string>();
  for (const v of [row?.profileImage, ...(row?.galleryImages ?? [])]) {
    if (v && isStored(v)) byHash.set(md5(v), v);
  }

  if (touchesProfile) {
    const hash = (update.profileImage as string).match(REF)![1];
    const stored = byHash.get(hash);
    if (stored && stored === row?.profileImage) delete update.profileImage; // unchanged
    else if (stored) update.profileImage = stored;
    else delete update.profileImage;
  }
  if (gallery && touchesGallery) {
    update.galleryImages = gallery.flatMap((v) => {
      if (typeof v !== "string") return [];
      const m = v.match(REF);
      if (!m) return [v];
      const stored = byHash.get(m[1]);
      return stored ? [stored] : [];
    });
  }
}
