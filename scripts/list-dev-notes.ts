/**
 * List unresolved developer notes (ParkingLotEntry type "developer").
 * Run: npx tsx scripts/list-dev-notes.ts
 */
import { readFileSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const dbUrl = readFileSync(join(__dirname, "..", ".env.local"), "utf-8").match(/^DATABASE_URL="?([^"\r\n]+)"?/m)![1];
const prisma = new PrismaClient({ adapter: new PrismaNeonHttp(dbUrl, {}) });

async function main() {
  const rows = await prisma.parkingLotEntry.findMany({
    where: { type: "developer", resolved: false },
    orderBy: { createdAt: "asc" },
  });
  console.log("Unresolved developer notes:", rows.length);
  for (const r of rows) {
    console.log(`\n[${r.id.slice(0, 8)}] ${r.createdAt.toISOString()}\n  ${r.text.replace(/\n/g, "\n  ")}`);
  }
  await prisma.$disconnect();
}
main();
