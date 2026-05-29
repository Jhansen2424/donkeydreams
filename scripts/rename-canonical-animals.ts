/**
 * Rename DB Animal rows + denormalized animalName references to match the
 * canonical names from the May 29 2026 adoption spreadsheet. Preserves all
 * related medical / hoof / dental / weight history via FK animalId.
 *
 * Dry-run by default. Pass --apply to actually write.
 *
 *   npx tsx scripts/rename-canonical-animals.ts            # dry-run
 *   npx tsx scripts/rename-canonical-animals.ts --apply    # commit
 *
 * The 12 renames are derived from the cross-reference between the May 29
 * spreadsheet (98 active donkeys) and donkey-profiles-data.ts. The 2
 * spreadsheet-only names that didn't pair off (Makuahine Hau, Seraphina) are
 * NOT renames — they're handled by the seed data refresh.
 */

import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { neonConfig } from "@neondatabase/serverless";

// Pick up DATABASE_URL from .env.local just like the Next app does.
config({ path: ".env.local" });

// Use the WebSocket Neon adapter (not the HTTP one used in src/lib/db.ts).
// The HTTP adapter is faster per-query but doesn't support transactions /
// multi-statement updates; each Prisma updateMany internally needs a
// transaction. Node doesn't have a native WebSocket, so wire ws explicitly.
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

// stale code-side name -> canonical spreadsheet name.
const RENAMES: Record<string, string> = {
  Petey: "Pete",
  Cloudy: "Cloud",
  Rosey: "Rosie",
  Dusky: "Dusk",
  Princes: "Princess",
  Venelope: "Vanellope",
  Sofie: "Sophie",
  Raineer: "Rainier",
  Kayla: "Kai-Ya",
  Izabelle: "Izabella (Izzy)",
  Skyla: "Skyla (Skye)",
  Nelley: "Nelly Belle",
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  const apply = process.argv.includes("--apply");
  console.log(`Mode: ${apply ? "APPLY (writes will commit)" : "DRY-RUN (no writes)"}`);
  console.log();

  let totalAnimals = 0;
  let totalMed = 0;
  let totalHoof = 0;
  let totalDental = 0;
  let totalWeigh = 0;
  let missing = 0;

  for (const [stale, canonical] of Object.entries(RENAMES)) {
    const row = await prisma.animal.findUnique({ where: { name: stale } });
    if (!row) {
      console.log(`  - ${stale}: not present in DB (skipping)`);
      missing++;
      continue;
    }

    // Count denormalized references that need updating.
    const medCount = await prisma.medicalEntry.count({ where: { animalId: row.id, animalName: stale } });
    const hoofCount = await prisma.hoofVisit.count({ where: { animalId: row.id, animalName: stale } });
    const dentalCount = await prisma.dentalVisit.count({ where: { animalId: row.id, animalName: stale } });
    const weighCount = await prisma.weighIn.count({ where: { animalId: row.id, animalName: stale } });

    console.log(
      `  ${stale} -> ${canonical}: animal row + ${medCount} med, ${hoofCount} hoof, ${dentalCount} dental, ${weighCount} weigh-in`
    );
    totalAnimals++;
    totalMed += medCount;
    totalHoof += hoofCount;
    totalDental += dentalCount;
    totalWeigh += weighCount;
  }

  console.log();
  console.log(
    `Totals: ${totalAnimals} animals renamed, ${totalMed} med + ${totalHoof} hoof + ${totalDental} dental + ${totalWeigh} weigh-in references updated, ${missing} not present.`
  );

  if (!apply) {
    console.log();
    console.log("Dry-run complete. Re-run with --apply to commit.");
    return;
  }

  // Apply phase — the Neon HTTP adapter doesn't support transactions, so we
  // run renames sequentially. Each rename is internally consistent: the
  // Animal row is updated first, then its denormalized animalName references.
  // A mid-list failure leaves earlier renames committed and later ones
  // untouched (just rerun for the rest — the renames are idempotent in the
  // sense that already-renamed rows are skipped because we look up by stale
  // name and won't find it).
  console.log();
  console.log("Applying (sequential — Neon HTTP adapter does not support transactions)...");
  const failures: string[] = [];
  for (const [stale, canonical] of Object.entries(RENAMES)) {
    try {
      // Look up by EITHER name — re-runnable after a partial failure where
      // the Animal row has been renamed but denorm references haven't.
      const row =
        (await prisma.animal.findUnique({ where: { name: canonical } })) ??
        (await prisma.animal.findUnique({ where: { name: stale } }));
      if (!row) {
        console.log(`  ${stale} / ${canonical}: no animal row found, skipping`);
        continue;
      }
      const newSlug = slugify(canonical);

      if (row.name !== canonical) {
        await prisma.animal.update({
          where: { id: row.id },
          data: { name: canonical, slug: newSlug },
        });
      }
      // updateMany on denormalized animalName. Match by animalId so we don't
      // touch unrelated rows that happened to share the stale text.
      const m = await prisma.medicalEntry.updateMany({
        where: { animalId: row.id, animalName: stale },
        data: { animalName: canonical },
      });
      const h = await prisma.hoofVisit.updateMany({
        where: { animalId: row.id, animalName: stale },
        data: { animalName: canonical },
      });
      const d = await prisma.dentalVisit.updateMany({
        where: { animalId: row.id, animalName: stale },
        data: { animalName: canonical },
      });
      const w = await prisma.weighIn.updateMany({
        where: { animalId: row.id, animalName: stale },
        data: { animalName: canonical },
      });
      console.log(
        `  ${stale} -> ${canonical}: ${m.count} med + ${h.count} hoof + ${d.count} dental + ${w.count} weigh updated`
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`  FAILED ${stale} -> ${canonical}: ${msg}`);
      failures.push(`${stale} -> ${canonical}: ${msg}`);
    }
  }
  console.log();
  if (failures.length === 0) {
    console.log("Done — all renames committed.");
  } else {
    console.log(`Done with ${failures.length} failure(s):`);
    for (const f of failures) console.log(`  ${f}`);
    process.exitCode = 1;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
