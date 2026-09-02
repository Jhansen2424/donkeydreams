/**
 * Migrate the code-baked (sheet-imported) medical entries into real
 * MedicalEntry DB rows so staff can edit/delete them like anything logged
 * in-app — the same treatment hoof visits got.
 *
 * Sets migrated: annual exams + condition/special-needs texts (adoption
 * sheet), deworming + vaccination doses + dated notes (checklist sheet).
 * The computed "Upcoming Vaccination" reminders are NOT migrated — they
 * derive from the next-vaccination dates at runtime.
 *
 * Idempotent: skips rows that already exist for (animal, type, title, date).
 * After running, src/lib/medical-data.ts must no longer aggregate the static
 * sets (done in the same commit) or entries would double.
 *
 * Run: npx tsx scripts/migrate-medical-to-db.ts [--apply]
 */
import { readFileSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { annualExamEntries, revisedMedicalEntries } from "../src/lib/donkey-profiles-data";
import {
  importedDewormingEntries,
  importedVaccinationEntries,
  checklistNoteEntries,
} from "../src/lib/deworming-vaccination-data";

const dbUrl = readFileSync(join(__dirname, "..", ".env.local"), "utf-8").match(/^DATABASE_URL="?([^"\r\n]+)"?/m)![1];
const prisma = new PrismaClient({ adapter: new PrismaNeonHttp(dbUrl, {}) });

const apply = process.argv.includes("--apply");

async function main() {
  console.log(apply ? "APPLY MODE\n" : "DRY RUN — pass --apply to write\n");
  const source = [
    ...annualExamEntries,
    ...revisedMedicalEntries,
    ...importedDewormingEntries,
    ...importedVaccinationEntries,
    ...checklistNoteEntries,
  ];
  console.log(`Static entries to migrate: ${source.length}`);

  const animals = await prisma.animal.findMany({ select: { id: true, name: true } });
  const byName = new Map(animals.map((a) => [a.name, a.id]));

  const existing = await prisma.medicalEntry.findMany({
    select: { animalName: true, type: true, title: true, date: true },
  });
  const have = new Set(existing.map((e) => `${e.animalName}|${e.type}|${e.title}|${e.date}`));

  let created = 0;
  let skippedDupe = 0;
  let skippedNoAnimal = 0;
  for (const e of source) {
    const animalId = byName.get(e.animal);
    if (!animalId) {
      skippedNoAnimal++;
      continue;
    }
    const key = `${e.animal}|${e.type}|${e.title}|${e.date}`;
    if (have.has(key)) {
      skippedDupe++;
      continue;
    }
    have.add(key);
    if (apply) {
      await prisma.medicalEntry.create({
        data: {
          animalId,
          animalName: e.animal,
          type: e.type,
          title: e.title,
          date: e.date,
          description: e.description ?? "",
          urgent: Boolean(e.urgent),
        },
      });
    }
    created++;
  }
  console.log(
    `${apply ? "Migrated" : "Would migrate"} ${created} · ${skippedDupe} already in DB · ${skippedNoAnimal} for removed donkeys`
  );
  console.log(`MedicalEntry rows now: ${await prisma.medicalEntry.count()}`);
}

main().finally(() => prisma.$disconnect());
