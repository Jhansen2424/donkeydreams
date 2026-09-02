/**
 * Syncs DB Animal rows from the generated donkeyProfiles map (adoption CSV).
 * Updates identity columns only — never touches photos, care dates, or
 * relations. Rows whose name isn't in the CSV are left untouched.
 *
 * Run: npx tsx scripts/sync-animals-from-profiles.ts [--apply]
 */
import { readFileSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { donkeyProfiles } from "../src/lib/donkey-profiles-data";

const envLocal = readFileSync(join(__dirname, "..", ".env.local"), "utf-8");
const dbUrl = envLocal.match(/^DATABASE_URL="?([^"\r\n]+)"?/m)?.[1];
if (!dbUrl) throw new Error("DATABASE_URL not found in .env.local");

const adapter = new PrismaNeonHttp(dbUrl, {});
const prisma = new PrismaClient({ adapter });

const apply = process.argv.includes("--apply");

async function main() {
  const dbAnimals = await prisma.animal.findMany({ select: { name: true } });
  const dbNames = new Set(dbAnimals.map((a) => a.name));

  const missingInDb: string[] = [];
  let updated = 0;

  for (const [name, p] of donkeyProfiles) {
    if (!dbNames.has(name)) {
      missingInDb.push(name);
      continue;
    }
    if (apply) {
      await prisma.animal.update({
        where: { name },
        data: {
          age: p.age === "Unknown" ? "" : p.age,
          sex: p.sex,
          size: p.size || null,
          color: p.color || null,
          origin: p.origin,
          herd: p.herd,
          intakeDate: p.intakeDate ?? "",
          adoptedFrom: p.adoptedFrom,
          bestFriends: p.bondedWith,
          parents: p.parents,
          children: p.children,
          momBabyCount: p.momBabyCount,
          isBondedPair: p.isBondedPair,
          isSpecialNeeds: p.isSpecialNeeds,
          needsChip: p.needsChip,
        },
      });
    }
    updated++;
  }

  const notInSheet = dbAnimals
    .map((a) => a.name)
    .filter((n) => !donkeyProfiles.has(n))
    .sort();

  console.log(`${apply ? "Updated" : "Would update"} ${updated} Animal rows from ${donkeyProfiles.size} profiles`);
  if (missingInDb.length) console.log(`In CSV but NOT in DB (skipped): ${missingInDb.join(", ")}`);
  if (notInSheet.length) console.log(`In DB but NOT in CSV (left untouched): ${notInSheet.join(", ")}`);
}

main().finally(() => prisma.$disconnect());
