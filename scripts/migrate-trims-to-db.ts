/**
 * One-off migration: move the adoption-sheet trim visits (code-baked
 * adoptionTrimVisits, ids "trim-adopt-N") into real HoofVisit DB rows so
 * staff can edit them like any logged visit. Idempotent — skips rows that
 * already exist for (animal, date). Also seeds the Provider table with the
 * farriers referenced by the imported rows so the edit modal's provider
 * select has matching options.
 *
 * Run: npx tsx scripts/migrate-trims-to-db.ts [--apply]
 */
import { readFileSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { adoptionTrimVisits } from "../src/lib/donkey-profiles-data";

const dbUrl = readFileSync(join(__dirname, "..", ".env.local"), "utf-8").match(/^DATABASE_URL="?([^"\r\n]+)"?/m)![1];
const prisma = new PrismaClient({ adapter: new PrismaNeonHttp(dbUrl, {}) });

const apply = process.argv.includes("--apply");

const PROVIDERS = [
  { name: "Edj Fish", type: "Farrier" },
  { name: "PVDR", type: "Farrier" },
  { name: "Donkey Dreams team", type: "Farrier" },
];

async function main() {
  console.log(apply ? "APPLY MODE\n" : "DRY RUN — pass --apply to write\n");

  for (const p of PROVIDERS) {
    const exists = await prisma.provider.findUnique({ where: { name: p.name } });
    if (exists) {
      console.log(`provider ${p.name}: already present`);
    } else if (apply) {
      await prisma.provider.create({ data: p });
      console.log(`provider ${p.name}: created`);
    } else {
      console.log(`provider ${p.name}: would create`);
    }
  }

  let created = 0;
  let skipped = 0;
  for (const v of adoptionTrimVisits) {
    const animal = await prisma.animal.findUnique({ where: { name: v.animal } });
    if (!animal) {
      console.log(`SKIP ${v.animal} — no Animal row`);
      continue;
    }
    const dupe = await prisma.hoofVisit.findFirst({
      where: { animalId: animal.id, date: v.date },
    });
    if (dupe) {
      skipped++;
      continue;
    }
    if (apply) {
      await prisma.hoofVisit.create({
        data: {
          animalId: animal.id,
          animalName: v.animal,
          date: v.date,
          provider: v.provider,
          notes: v.notes,
        },
      });
    }
    created++;
    console.log(`${apply ? "created" : "would create"}: ${v.animal} ${v.date} (${v.provider || "no provider"})`);
  }
  console.log(`\n${apply ? "Created" : "Would create"} ${created} hoof visits, ${skipped} already present.`);
}

main().finally(() => prisma.$disconnect());
