/**
 * Diagnostic: dump TaskTemplates and recent TaskCompletions to see why
 * "daily routines disappeared" for the client.
 * Run: npx tsx scripts/inspect-routines.ts
 */
import { readFileSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const dbUrl = readFileSync(join(__dirname, "..", ".env.local"), "utf-8").match(/^DATABASE_URL="?([^"\r\n]+)"?/m)![1];
const prisma = new PrismaClient({ adapter: new PrismaNeonHttp(dbUrl, {}) });

async function main() {
  const templates = await prisma.taskTemplate.findMany({ orderBy: { createdAt: "asc" } });
  console.log("=== TaskTemplates:", templates.length, "===");
  for (const t of templates) {
    console.log(
      `[${t.id.slice(0, 8)}] "${t.task.slice(0, 55)}" block=${t.block} repeatDays=${JSON.stringify(t.repeatDays)} skip=${JSON.stringify(t.skipDates)} animal=${t.animalSpecific ?? "-"} created=${t.createdAt.toISOString()} note=${t.note ? t.note.length + "ch" : "-"}`
    );
  }

  const completions = await prisma.taskCompletion.findMany({
    where: { date: { gte: "2026-08-28" } },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });
  console.log("\n=== TaskCompletions since 2026-08-28:", completions.length, "===");
  let cur = "";
  for (const c of completions) {
    if (c.date !== cur) {
      cur = c.date;
      console.log(`\n--- ${c.date} ---`);
    }
    console.log(
      `  [${c.id.slice(0, 8)}] tmpl=${c.templateId ? c.templateId.slice(0, 8) : "NONE"} "${(c.task ?? "").slice(0, 55)}" block=${c.block} done=${c.done} note=${c.note ? c.note.length + "ch" : "-"}`
    );
  }
  await prisma.$disconnect();
}
main();
