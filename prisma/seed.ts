import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { neonConfig } from "@neondatabase/serverless";

// Node lacks a native WebSocket; the Neon driver needs one for transactions
// (upsert/createMany use them). Point it at the `ws` library.
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL must be set for seeding");
}
// Use the WebSocket-based adapter for seeding so transactions work.
// The app itself keeps using PrismaNeonHttp for serverless-friendly requests.
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

// ── Import static data ──
// We import from the compiled source files
// Run with: npx tsx prisma/seed.ts

async function main() {
  console.log("Seeding database...");

  // ── 1. Animals ──
  const { animals } = await import("../src/lib/animals");
  console.log(`Seeding ${animals.length} animals...`);

  for (const animal of animals) {
    await prisma.animal.upsert({
      where: { slug: animal.slug },
      update: {},
      create: {
        name: animal.name,
        slug: animal.slug,
        age: animal.age,
        sex: animal.sex,
        origin: animal.origin,
        status: animal.status,
        herd: animal.herd,
        pen: animal.pen,
        tagline: animal.tagline,
        story: animal.story,
        sponsorable: animal.sponsorable,
        intakeDate: animal.intakeDate,
        adoptedFrom: animal.adoptedFrom,
        behavioralNotes: animal.behavioralNotes,
        profileImage: animal.profileImage ?? null,
        galleryImages: animal.galleryImages ?? [],
        traits: animal.traits,
        bestFriends: animal.bestFriends,
      },
    });
  }
  console.log("  Animals done.");

  // ── 2. Medical Entries ──
  // Only seed CSV-sourced medical records (deworming/vaccination history from
  // the sanctuary's real logs). The dummy hand-typed `medicalEntries` in
  // medical-data.ts is NOT seeded — users add real entries via the app.
  const { importedDewormingEntries } = await import("../src/lib/deworming-vaccination-data");
  const medicalEntries = importedDewormingEntries;
  console.log(`Seeding ${medicalEntries.length} medical entries (CSV-sourced)...`);

  for (const entry of medicalEntries) {
    const animal = await prisma.animal.findFirst({
      where: { name: entry.animal },
    });
    if (!animal) {
      console.warn(`  Skipping medical entry for unknown animal: ${entry.animal}`);
      continue;
    }
    await prisma.medicalEntry.create({
      data: {
        animalId: animal.id,
        animalName: entry.animal,
        type: entry.type,
        title: entry.title,
        date: entry.date,
        description: entry.description,
        urgent: entry.urgent,
      },
    });
  }
  console.log("  Medical entries done.");

  // ── 3. Watch Alerts, Feed Schedules — NOT seeded ──
  // These were hand-typed dummy data and are no longer part of the seed.
  // Users add real watch alerts and feed schedules via the app.

  // ── 4. Volunteers ──
  // Seed only the three core admins. Other volunteers are added via the app.
  const coreAdmins = [
    { name: "Edj Fish",  email: "edj@donkeydreams.org" },
    { name: "Amber",     email: "amber@donkeydreams.org" },
    { name: "Josh",      email: "joshua@webaholics.co" },
  ];
  console.log(`Seeding ${coreAdmins.length} core admins...`);
  for (const admin of coreAdmins) {
    await prisma.volunteer.upsert({
      where: { email: admin.email },
      update: {},
      create: {
        name: admin.name,
        email: admin.email,
        role: "admin",
        status: "active",
        startDate: new Date().toISOString().split("T")[0],
        availability: [],
        skills: [],
      },
    });
  }
  console.log("  Core admins done.");

  // ── 6. Hoof & Dental Visits ──
  const { visitHistory } = await import("../src/lib/hoof-dental-data");
  const hoofVisits = visitHistory.filter((v) => v.type === "hoof");
  const dentalVisits = visitHistory.filter((v) => v.type === "dental");

  console.log(`Seeding ${hoofVisits.length} hoof visits, ${dentalVisits.length} dental visits...`);

  for (const visit of hoofVisits) {
    const animal = await prisma.animal.findFirst({
      where: { name: visit.animal },
    });
    if (!animal) continue;
    await prisma.hoofVisit.create({
      data: {
        animalId: animal.id,
        animalName: visit.animal,
        date: visit.date,
        provider: visit.provider,
        notes: visit.notes,
      },
    });
  }

  for (const visit of dentalVisits) {
    const animal = await prisma.animal.findFirst({
      where: { name: visit.animal },
    });
    if (!animal) continue;
    await prisma.dentalVisit.create({
      data: {
        animalId: animal.id,
        animalName: visit.animal,
        date: visit.date,
        provider: visit.provider,
        notes: visit.notes,
      },
    });
  }
  console.log("  Hoof & dental visits done.");

  console.log("\nSeed complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
