import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL must be set for seeding");
}
const adapter = new PrismaNeonHttp(connectionString, {});
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
  const { medicalEntries } = await import("../src/lib/medical-data");
  console.log(`Seeding ${medicalEntries.length} medical entries...`);

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

  // ── 3. Watch Alerts ──
  const { watchList } = await import("../src/lib/sanctuary-data");
  console.log(`Seeding ${watchList.length} watch alerts...`);

  for (const entry of watchList) {
    const animal = await prisma.animal.findFirst({
      where: { name: entry.animal },
    });
    if (!animal) {
      console.warn(`  Skipping watch alert for unknown animal: ${entry.animal}`);
      continue;
    }
    await prisma.watchAlert.create({
      data: {
        animalId: animal.id,
        animalName: entry.animal,
        date: entry.date,
        issue: entry.issue,
        treatment: entry.treatment,
        assignedTo: entry.assignedTo,
        severity: entry.severity,
      },
    });
  }
  console.log("  Watch alerts done.");

  // ── 4. Feed Schedules ──
  const { feedSchedules } = await import("../src/lib/sanctuary-data");
  console.log(`Seeding ${feedSchedules.length} feed schedules...`);

  for (const feed of feedSchedules) {
    const animal = await prisma.animal.findFirst({
      where: { name: feed.animal },
    });
    if (!animal) {
      console.warn(`  Skipping feed schedule for unknown animal: ${feed.animal}`);
      continue;
    }
    await prisma.feedSchedule.upsert({
      where: { animalId: animal.id },
      update: {},
      create: {
        animalId: animal.id,
        animalName: feed.animal,
        amPlan: JSON.parse(JSON.stringify(feed.plan.am)),
        midPlan: JSON.parse(JSON.stringify(feed.plan.mid)),
        pmPlan: JSON.parse(JSON.stringify(feed.plan.pm)),
        notes: feed.notes ?? null,
      },
    });
  }
  console.log("  Feed schedules done.");

  // ── 5. Volunteers ──
  const { volunteers } = await import("../src/lib/volunteer-data");
  console.log(`Seeding ${volunteers.length} volunteers...`);

  for (const vol of volunteers) {
    await prisma.volunteer.upsert({
      where: { email: vol.email },
      update: {},
      create: {
        name: vol.name,
        email: vol.email,
        phone: vol.phone,
        role: vol.role,
        status: vol.status,
        startDate: vol.startDate,
        availability: vol.availability,
        skills: vol.skills,
        emergencyName: vol.emergencyContact.name,
        emergencyPhone: vol.emergencyContact.phone,
        emergencyRelation: vol.emergencyContact.relation,
        notes: vol.notes,
        hoursThisMonth: vol.hoursThisMonth,
        committedHoursPerDay: vol.committedHoursPerDay,
      },
    });
  }
  console.log("  Volunteers done.");

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
