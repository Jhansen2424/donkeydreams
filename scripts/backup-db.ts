/**
 * Full database backup: dumps every table to JSON files under
 * backups/<date>-<label>/ (gitignored). Run before anything destructive.
 * Run: npx tsx scripts/backup-db.ts <label>
 */
import { readFileSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const dbUrl = readFileSync(join(__dirname, "..", ".env.local"), "utf-8").match(/^DATABASE_URL="?([^"\r\n]+)"?/m)![1];
const prisma = new PrismaClient({ adapter: new PrismaNeonHttp(dbUrl, {}) });

async function main() {
  const label = process.argv[2] || "backup";
  const date = new Date().toLocaleDateString("en-CA");
  const dir = join(__dirname, "..", "backups", `${date}-${label}`);
  mkdirSync(dir, { recursive: true });

  // Every delegate on the client (model names in camelCase).
  const models = Object.keys(prisma).filter(
    (k) => !k.startsWith("$") && !k.startsWith("_")
  );
  for (const model of models) {
    const delegate = (prisma as unknown as Record<string, { findMany?: (args?: unknown) => Promise<unknown[]> }>)[model];
    if (!delegate || typeof delegate.findMany !== "function") continue;
    try {
      const rows = await delegate.findMany();
      writeFileSync(join(dir, `${model}.json`), JSON.stringify(rows, null, 1), "utf-8");
      console.log(`${model}: ${rows.length} rows`);
    } catch (e) {
      console.error(`${model}: FAILED`, e instanceof Error ? e.message : e);
    }
  }
  console.log(`\nBackup written to ${dir}`);
  await prisma.$disconnect();
}
main();
