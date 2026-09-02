/**
 * Restore the pre-wipe hoof visit history from
 * backups/2026-08-24-pre-wipe/hoof-visits.json into HoofVisit rows.
 *
 * The blank-slate wipe removed all 668 historical trims expecting a
 * "Trimming Notes FINAL" sheet that never arrived; staff now miss the
 * history on profiles. Animals are matched by their ORIGINAL row id (Animal
 * rows were never deleted, only cleared/renamed), so renames like
 * Saraphina→Seraphina resolve correctly. Idempotent: skips any visit that
 * already exists for the same animal + date.
 *
 * Run: npx tsx scripts/restore-hoof-backup.ts [--apply]
 */
import { readFileSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const dbUrl = readFileSync(join(__dirname, "..", ".env.local"), "utf-8").match(/^DATABASE_URL="?([^"\r\n]+)"?/m)![1];
const prisma = new PrismaClient({ adapter: new PrismaNeonHttp(dbUrl, {}) });

const BACKUP = join(__dirname, "..", "backups", "2026-08-24-pre-wipe", "hoof-visits.json");
const apply = process.argv.includes("--apply");

interface BackupVisit {
  id: string;
  animalId: string;
  animalName: string;
  date: string;
  provider: string;
  notes: string;
}

async function main() {
  console.log(apply ? "APPLY MODE\n" : "DRY RUN — pass --apply to write\n");
  const visits = JSON.parse(readFileSync(BACKUP, "utf-8")) as BackupVisit[];
  console.log(`Backup contains ${visits.length} hoof visits`);

  const animals = await prisma.animal.findMany({ select: { id: true, name: true } });
  const byId = new Map(animals.map((a) => [a.id, a]));

  const existing = await prisma.hoofVisit.findMany({
    select: { animalId: true, date: true },
  });
  const have = new Set(existing.map((v) => `${v.animalId}|${v.date}`));

  let created = 0;
  let skippedDupe = 0;
  let skippedNoAnimal = 0;
  for (const v of visits) {
    const animal = byId.get(v.animalId);
    if (!animal) {
      skippedNoAnimal++;
      console.log(`no Animal row for ${v.animalName} (${v.animalId}) — skipped`);
      continue;
    }
    const key = `${animal.id}|${v.date}`;
    if (have.has(key)) {
      skippedDupe++;
      continue;
    }
    have.add(key);
    if (apply) {
      await prisma.hoofVisit.create({
        data: {
          animalId: animal.id,
          animalName: animal.name, // current canonical name, not the stale one
          date: v.date,
          provider: v.provider ?? "",
          notes: v.notes ?? "",
        },
      });
    }
    created++;
  }
  console.log(
    `\n${apply ? "Restored" : "Would restore"} ${created} visits · ${skippedDupe} already present · ${skippedNoAnimal} without an animal row`
  );
  const total = await prisma.hoofVisit.count();
  console.log(`HoofVisit rows now in DB: ${total}`);
}

main().finally(() => prisma.$disconnect());
