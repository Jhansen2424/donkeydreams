/**
 * One-off backfill for the tasks/routines merge: every TaskTemplate and
 * TaskCompletion gets tags = [category] where tags is still empty, so the
 * new multi-tag filters see all existing tasks. Idempotent.
 * Run: npx tsx scripts/backfill-task-tags.ts
 */
import { readFileSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const dbUrl = readFileSync(join(__dirname, "..", ".env.local"), "utf-8").match(/^DATABASE_URL="?([^"\r\n]+)"?/m)![1];
const prisma = new PrismaClient({ adapter: new PrismaNeonHttp(dbUrl, {}) });

async function main() {
  const t = await prisma.$executeRawUnsafe(
    `UPDATE "TaskTemplate" SET tags = ARRAY[category] WHERE cardinality(tags) = 0 AND category <> ''`
  );
  const c = await prisma.$executeRawUnsafe(
    `UPDATE "TaskCompletion" SET tags = ARRAY[category] WHERE cardinality(tags) = 0 AND category <> ''`
  );
  console.log(`Backfilled tags: ${t} templates, ${c} completions`);
  await prisma.$disconnect();
}
main();
