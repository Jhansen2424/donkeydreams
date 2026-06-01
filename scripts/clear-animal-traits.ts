/**
 * Clear Animal.traits to [] for every row in the DB. Schema column + UI render
 * stay intact so staff can re-add traits later via the profile edit form.
 *
 * Dry-run by default. --apply commits.
 *
 *   npx tsx scripts/clear-animal-traits.ts            # dry-run
 *   npx tsx scripts/clear-animal-traits.ts --apply    # commit
 */

import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { neonConfig } from "@neondatabase/serverless";

config({ path: ".env.local" });
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL not set");
}
const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

async function main() {
  const apply = process.argv.includes("--apply");
  console.log(`Mode: ${apply ? "APPLY" : "DRY-RUN"}\n`);

  const populated = await prisma.animal.findMany({
    where: { traits: { isEmpty: false } },
    select: { name: true, traits: true },
  });
  console.log(`Animals with non-empty traits: ${populated.length}`);
  for (const a of populated) {
    console.log(`  ${a.name}: ${JSON.stringify(a.traits)}`);
  }

  if (!apply) {
    console.log("\nDry-run complete. --apply to commit.");
    await prisma.$disconnect();
    return;
  }

  const res = await prisma.animal.updateMany({
    where: { traits: { isEmpty: false } },
    data: { traits: [] },
  });
  console.log(`\nCleared traits on ${res.count} rows.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
