// ── Watch List (Donkeys to Watch) ──
export interface WatchListEntry {
  date: string;
  animal: string;
  issue: string;
  treatment: string;
  assignedTo: string;
  severity: "high" | "medium" | "low";
}

// Dummy data removed — real watch alerts live in Neon (WatchAlert table).
// Consumers that still read this array will simply see no items. The watch
// list UI will be wired to the DB in a later phase.
export const watchList: WatchListEntry[] = [];

// ── Feed Schedules ──
export interface FeedEntry {
  item: string;
  amount: string;
}

export interface MealPlan {
  am: FeedEntry[];
  mid: FeedEntry[];
  pm: FeedEntry[];
}

export interface FeedSchedule {
  animal: string;
  plan: MealPlan;
  notes: string;
}

// Dummy data removed — feed schedules will live in Neon (FeedSchedule table).
export const feedSchedules: FeedSchedule[] = [];

/* Removed hand-typed feed schedules — kept here commented for reference until
   the admin UI is built. TODO: delete block when FeedSchedule admin exists.
const _removedFeedSchedules: FeedSchedule[] = [
  {
    animal: "Pete",
    plan: {
      am: [
        { item: "Teff", amount: "2 scoops" },
        { item: "Beets", amount: "1/2 scoop" },
        { item: "Flax", amount: "1 scoop" },
      ],
      mid: [
        { item: "Teff", amount: "2 scoops" },
        { item: "Beets", amount: "1/2 scoop" },
        { item: "Flax", amount: "1 scoop" },
      ],
      pm: [
        { item: "Teff", amount: "2 scoops" },
        { item: "Beets", amount: "1/2 scoop" },
      ],
    },
    notes: "Senior — soft mash consistency. Joint supplement in AM.",
  },
  {
    animal: "Edgar",
    plan: {
      am: [
        { item: "Teff", amount: "3 scoops" },
        { item: "Beets", amount: "1 scoop" },
      ],
      mid: [
        { item: "Teff", amount: "3 scoops" },
        { item: "Beets", amount: "1 scoop" },
        { item: "Flax", amount: "1 scoop" },
      ],
      pm: [
        { item: "Teff", amount: "3 scoops" },
        { item: "Beets", amount: "1 scoop" },
      ],
    },
    notes: "Club Herd feed. Extra water in bucket.",
  },
  {
    animal: "Winky",
    plan: {
      am: [
        { item: "Teff", amount: "3 scoops" },
        { item: "Beets", amount: "1 scoop" },
      ],
      mid: [
        { item: "Teff", amount: "3 scoops" },
        { item: "Beets", amount: "1 scoop" },
        { item: "Flax", amount: "1 scoop" },
      ],
      pm: [
        { item: "Teff", amount: "3 scoops" },
        { item: "Beets", amount: "1 scoop" },
      ],
    },
    notes: "Club Herd feed. Ground level trough only.",
  },
  {
    animal: "Swayze",
    plan: {
      am: [
        { item: "Teff", amount: "3 scoops" },
        { item: "Beets", amount: "1 scoop" },
      ],
      mid: [
        { item: "Teff", amount: "3 scoops" },
        { item: "Beets", amount: "1 scoop" },
        { item: "Flax", amount: "1 scoop" },
      ],
      pm: [
        { item: "Teff", amount: "3 scoops" },
        { item: "Beets", amount: "1 scoop" },
      ],
    },
    notes: "Club Herd feed. Joint supplement daily.",
  },
  {
    animal: "Elanora",
    plan: {
      am: [
        { item: "Teff", amount: "1.5 scoops" },
        { item: "Beets", amount: "1/4 scoop" },
      ],
      mid: [
        { item: "Teff", amount: "1 scoop" },
        { item: "Beets", amount: "1/4 scoop" },
      ],
      pm: [
        { item: "Teff", amount: "1.5 scoops" },
        { item: "Beets", amount: "1/4 scoop" },
      ],
    },
    notes: "",
  },
  {
    animal: "Herman",
    plan: {
      am: [
        { item: "Teff", amount: "2.5 scoops" },
        { item: "Beets", amount: "1/2 scoop" },
        { item: "Combo", amount: "1 line" },
      ],
      mid: [
        { item: "Teff", amount: "3 scoops" },
        { item: "Beets", amount: "1/2 scoop" },
      ],
      pm: [
        { item: "Teff", amount: "2.5 scoops" },
        { item: "Beets", amount: "1/2 scoop" },
      ],
    },
    notes: "No flax. PM snack. Mask during meals. DMSO treatment at lunch.",
  },
  {
    animal: "Tenzel",
    plan: {
      am: [
        { item: "Teff", amount: "1.5 scoops" },
        { item: "Beets", amount: "1/4 scoop" },
      ],
      mid: [
        { item: "Teff", amount: "1.5 scoops" },
        { item: "Beets", amount: "1/4 scoop" },
        { item: "Flax", amount: "1 scoop" },
      ],
      pm: [
        { item: "Teff", amount: "1.5 scoops" },
        { item: "Beets", amount: "1/4 scoop" },
      ],
    },
    notes: "Slow eater — separate from food-aggressive donkeys. Mask off at dinner. Treatment at lunch.",
  },
  {
    animal: "Gabriel",
    plan: {
      am: [
        { item: "Teff", amount: "1 scoop" },
        { item: "Beets", amount: "1/4 scoop" },
      ],
      mid: [],
      pm: [
        { item: "Teff", amount: "1 scoop" },
        { item: "Beets", amount: "1/4 scoop" },
      ],
    },
    notes: "Senior supplement in AM. Skip mid-day meal (marked X on board). Growing donkey — adjust as needed.",
  },
  {
    animal: "Nelley",
    plan: {
      am: [
        { item: "Teff", amount: "2 scoops" },
        { item: "Beets", amount: "3/4 scoop" },
        { item: "Flax", amount: "1 scoop" },
      ],
      mid: [
        { item: "Teff", amount: "2 scoops" },
        { item: "Beets", amount: "3/4 scoop" },
      ],
      pm: [
        { item: "Teff", amount: "2 scoops" },
        { item: "Beets", amount: "3/4 scoop" },
      ],
    },
    notes: "",
  },
  {
    animal: "Blossom",
    plan: {
      am: [
        { item: "Teff", amount: "1 scoop" },
        { item: "Beets", amount: "1/2 scoop" },
      ],
      mid: [
        { item: "Teff", amount: "1 scoop" },
        { item: "Beets", amount: "1/2 scoop" },
      ],
      pm: [
        { item: "Teff", amount: "1 scoop" },
        { item: "Beets", amount: "1/2 scoop" },
      ],
    },
    notes: "Dental issues — soft food only. 3/26 ate 1/2 mid. Spray at breakfast. Treatment at lunch.",
  },
  {
    animal: "Ophelia",
    plan: {
      am: [
        { item: "Teff", amount: "1 scoop" },
        { item: "Beets", amount: "1/4 scoop" },
      ],
      mid: [],
      pm: [
        { item: "Teff", amount: "1 scoop" },
        { item: "Beets", amount: "1/4 scoop" },
      ],
    },
    notes: "",
  },
  {
    animal: "Dawn",
    plan: {
      am: [
        { item: "Teff", amount: "1/4 scoop" },
        { item: "Beets", amount: "1/4 scoop" },
      ],
      mid: [
        { item: "Teff", amount: "1/2 scoop" },
        { item: "Beets", amount: "1/4 scoop" },
      ],
      pm: [
        { item: "Teff", amount: "1/4 scoop" },
        { item: "Beets", amount: "1/4 scoop" },
      ],
    },
    notes: "",
  },
  {
    animal: "Finn",
    plan: {
      am: [
        { item: "Teff", amount: "1 scoop" },
        { item: "Beets", amount: "1/4 scoop" },
      ],
      mid: [
        { item: "Teff", amount: "1/2 scoop" },
        { item: "Beets", amount: "1/4 scoop" },
      ],
      pm: [
        { item: "Teff", amount: "1 scoop" },
        { item: "Beets", amount: "1/4 scoop" },
      ],
    },
    notes: "",
  },
];
*/

export type FeedNoteCategory = "daily" | "ongoing" | "evergreen";

export interface FeedNote {
  text: string;
  category: FeedNoteCategory;
}

// Dummy data removed — feed notes will be editable via the app later.
export const feedNotes: FeedNote[] = [];

// ── Daily Schedule ──
export type TaskCategory = "routine" | "feeding" | "treatment" | "special-needs" | "hoof-dental" | "weight" | "sponsor" | "projects" | "admin" | "care" | "ranch";
export type TaskSource = "base" | "watch-list" | "feed-schedule" | "hoof-dental" | "weight" | "sponsor" | "manual";

export interface ScheduleTask {
  task: string;
  assignedTo?: string;
  done: boolean;
  animalSpecific?: string;
  note?: string;
  category: TaskCategory;
  source: TaskSource;
  estimatedMinutes?: number;
}

export interface ScheduleBlock {
  name: string;
  time: string;
  tasks: ScheduleTask[];
}

export interface AnimalTaskGroup {
  animal: string;
  tasks: { task: ScheduleTask; block: string }[];
}

// ── Routine Assignments (dummy data removed) ──
export interface RoutineAssignment {
  volunteer: string;
  days: string[];
  blocks?: string[];
  categories?: TaskCategory[];
}
export const routineAssignments: RoutineAssignment[] = [];

// ── Daily schedule skeleton ──
// The whiteboard task templates have been removed. The schedule starts empty
// each day; tasks are added via the app (or by Joshy) and will be persisted
// to Neon in a later phase. Keep the three time blocks so the UI layout
// renders correctly.
export function generateDailySchedule(): ScheduleBlock[] {
  return [
    { name: "AM",  time: "6:00 – 9:00 AM", tasks: [] },
    { name: "Mid", time: "10:30 AM – 2:00 PM", tasks: [] },
    { name: "PM",  time: "4:00 – 6:30 PM", tasks: [] },
  ];
}

// Legacy generator body (commented out — referenced removed data).
/*
function _unusedScheduleEngine(): ScheduleBlock[] {
  const schedule: ScheduleBlock[] = baseSchedule.map((block) => ({
    ...block,
    tasks: block.tasks.map((t) => ({ ...t })),
  }));

  // Track which animals already have tasks in each block to avoid duplicates
  const existingTasks = new Set<string>();
  schedule.forEach((block) =>
    block.tasks.forEach((t) => {
      if (t.animalSpecific) {
        t.animalSpecific.split(", ").forEach((a) =>
          existingTasks.add(`${block.name}:${a}:${t.task}`)
        );
      }
    })
  );

  // Inject watch list monitoring tasks into Breakfast block
  const breakfast = schedule.find((b) => b.name === "Breakfast")!;
  const lunch = schedule.find((b) => b.name === "Lunch")!;

  for (const entry of watchList) {
    const key = `Breakfast:${entry.animal}:monitor`;
    if (!existingTasks.has(key)) {
      breakfast.tasks.push({
        task: `Monitor ${entry.animal}: ${entry.issue}`,
        done: false,
        animalSpecific: entry.animal,
        assignedTo: entry.assignedTo !== "Staff" ? entry.assignedTo : undefined,
        note: entry.treatment,
        category: "special-needs",
        source: "watch-list",
        estimatedMinutes: 5,
      });
      existingTasks.add(key);
    }
  }

  // Inject feed-specific reminders for animals with special notes
  for (const feed of feedSchedules) {
    if (!feed.notes) continue;
    const notes = feed.notes.toLowerCase();

    // Senior supplements → breakfast reminder
    if (notes.includes("senior supplement") || notes.includes("joint supplement")) {
      const key = `Breakfast:${feed.animal}:supplement`;
      if (!existingTasks.has(key)) {
        breakfast.tasks.push({
          task: `${feed.animal}: Give ${notes.includes("senior") ? "senior" : "joint"} supplement with AM feed`,
          done: false,
          animalSpecific: feed.animal,
          category: "feeding",
          source: "feed-schedule",
          estimatedMinutes: 5,
        });
        existingTasks.add(key);
      }
    }

    // Soft food / dental notes → feeding reminder
    if (notes.includes("soft") || notes.includes("dental") || notes.includes("moist")) {
      const key = `Breakfast:${feed.animal}:soft-food`;
      if (!existingTasks.has(key)) {
        breakfast.tasks.push({
          task: `${feed.animal}: Ensure soft/moist food consistency`,
          done: false,
          animalSpecific: feed.animal,
          category: "feeding",
          source: "feed-schedule",
          estimatedMinutes: 5,
        });
        existingTasks.add(key);
      }
    }

    // PM snack → dinner reminder
    if (notes.includes("pm snack")) {
      const dinner = schedule.find((b) => b.name === "Dinner")!;
      const key = `Dinner:${feed.animal}:pm-snack`;
      if (!existingTasks.has(key)) {
        dinner.tasks.push({
          task: `${feed.animal}: PM snack`,
          done: false,
          animalSpecific: feed.animal,
          category: "feeding",
          source: "feed-schedule",
          estimatedMinutes: 5,
        });
        existingTasks.add(key);
      }
    }

    // DMSO / treatment at lunch
    if (notes.includes("dmso") || notes.includes("treatment at lunch")) {
      const key = `Lunch:${feed.animal}:feed-treatment`;
      if (!existingTasks.has(key)) {
        lunch.tasks.push({
          task: `${feed.animal}: Lunch treatment (from feed notes)`,
          done: false,
          animalSpecific: feed.animal,
          category: "treatment",
          source: "feed-schedule",
          estimatedMinutes: 10,
        });
        existingTasks.add(key);
      }
    }
  }

  // Inject hoof/dental due-soon and overdue tasks into Breakfast block
  try {
    const { computeAnimalCareStatuses } = require("./hoof-dental-data");
    const careStatuses = computeAnimalCareStatuses() as {
      animal: string;
      hoofStatus: string;
      dentalStatus: string;
      daysUntilHoof: number | null;
      daysUntilDental: number | null;
    }[];

    for (const care of careStatuses) {
      if (care.hoofStatus === "overdue" || care.hoofStatus === "due-soon") {
        const key = `Breakfast:${care.animal}:hoof-due`;
        if (!existingTasks.has(key)) {
          const label = care.hoofStatus === "overdue"
            ? `${care.animal}: Hoof trim OVERDUE (${Math.abs(care.daysUntilHoof!)}d)`
            : `${care.animal}: Hoof trim due in ${care.daysUntilHoof}d`;
          breakfast.tasks.push({
            task: label,
            done: false,
            animalSpecific: care.animal,
            category: "hoof-dental",
            source: "hoof-dental",
            estimatedMinutes: 5,
          });
          existingTasks.add(key);
        }
      }

      if (care.dentalStatus === "overdue" || care.dentalStatus === "due-soon") {
        const key = `Breakfast:${care.animal}:dental-due`;
        if (!existingTasks.has(key)) {
          const label = care.dentalStatus === "overdue"
            ? `${care.animal}: Dental check OVERDUE (${Math.abs(care.daysUntilDental!)}d)`
            : `${care.animal}: Dental check due in ${care.daysUntilDental}d`;
          breakfast.tasks.push({
            task: label,
            done: false,
            animalSpecific: care.animal,
            category: "hoof-dental",
            source: "hoof-dental",
            estimatedMinutes: 5,
          });
          existingTasks.add(key);
        }
      }
    }
  } catch {
    // hoof-dental-data not available yet — skip injection
  }

  // Inject overdue weigh-in alerts into Breakfast block
  try {
    const { computeWeightStatuses } = require("./weight-data");
    const weightStatuses = computeWeightStatuses() as {
      animal: string;
      flag: string;
      daysSinceWeighIn: number | null;
      config: { weighInIntervalDays: number };
    }[];

    for (const ws of weightStatuses) {
      if (ws.flag !== "overdue") continue;
      const key = `Breakfast:${ws.animal}:weight-overdue`;
      if (existingTasks.has(key)) continue;

      const daysOver = ws.daysSinceWeighIn! - ws.config.weighInIntervalDays;
      breakfast.tasks.push({
        task: `${ws.animal}: Weigh-in OVERDUE (${daysOver}d past due)`,
        done: false,
        animalSpecific: ws.animal,
        category: "weight",
        source: "weight",
        estimatedMinutes: 5,
      });
      existingTasks.add(key);
    }
  } catch {
    // weight-data not available yet — skip injection
  }

  // Inject sponsor update reminders into Breakfast block
  try {
    const { getAnimalsNeedingUpdates } = require("./sponsor-data");
    const needsUpdate = getAnimalsNeedingUpdates() as {
      animal: string;
      sponsors: { name: string }[];
      daysSinceLastUpdate: number | null;
    }[];

    for (const su of needsUpdate) {
      const key = `Breakfast:${su.animal}:sponsor-update`;
      if (existingTasks.has(key)) continue;

      const count = su.sponsors.length;
      breakfast.tasks.push({
        task: `Send sponsor update for ${su.animal} (${count} sponsor${count !== 1 ? "s" : ""}, ${su.daysSinceLastUpdate}d since last)`,
        done: false,
        animalSpecific: su.animal,
        category: "sponsor",
        source: "sponsor",
        estimatedMinutes: 15,
      });
      existingTasks.add(key);
    }
  } catch {
    // sponsor-data not available yet — skip injection
  }

  // ── Apply routine auto-assignments based on day of week ──
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const todayDay = dayNames[new Date().getDay()];

  for (const assignment of routineAssignments) {
    if (!assignment.days.includes(todayDay)) continue;

    for (const block of schedule) {
      // Skip blocks not in the assignment scope
      if (assignment.blocks && !assignment.blocks.includes(block.name)) continue;

      for (const task of block.tasks) {
        // Skip already-assigned tasks
        if (task.assignedTo) continue;

        // Check category match
        if (assignment.categories && !assignment.categories.includes(task.category)) continue;

        // Auto-assign
        task.assignedTo = assignment.volunteer;
      }
    }
  }

  // ── Apply default durations to any tasks missing estimatedMinutes ──
  for (const block of schedule) {
    for (const task of block.tasks) {
      if (!task.estimatedMinutes) {
        task.estimatedMinutes = defaultDurations[task.category] ?? 10;
      }
    }
  }

  return schedule;
}
*/

// Convenience export (now empty — daily schedule starts blank)
export const dailySchedule = generateDailySchedule();

// ── Group Tasks By Animal ──
export function groupTasksByAnimal(schedule: ScheduleBlock[]): AnimalTaskGroup[] {
  const map = new Map<string, { task: ScheduleTask; block: string }[]>();

  for (const block of schedule) {
    for (const task of block.tasks) {
      if (task.animalSpecific) {
        // Split multi-animal tasks (e.g. "Herman, Tenzel")
        const animals = task.animalSpecific.split(", ").map((a) => a.trim());
        for (const animal of animals) {
          if (!map.has(animal)) map.set(animal, []);
          map.get(animal)!.push({ task, block: block.name });
        }
      }
    }
  }

  // Sort alphabetically, then by block order
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([animal, tasks]) => ({ animal, tasks }));
}

// ── Get all unique animals that have tasks today ──
export function getTaskAnimals(schedule: ScheduleBlock[]): string[] {
  const animals = new Set<string>();
  for (const block of schedule) {
    for (const task of block.tasks) {
      if (task.animalSpecific) {
        task.animalSpecific.split(", ").forEach((a) => animals.add(a.trim()));
      }
    }
  }
  return Array.from(animals).sort();
}

// ── Category labels & colors for UI ──
export const categoryMeta: Record<TaskCategory, { label: string; color: string; bg: string }> = {
  routine: { label: "Routine", color: "text-warm-gray", bg: "bg-warm-gray/10" },
  feeding: { label: "Feed", color: "text-amber-700", bg: "bg-amber-50" },
  treatment: { label: "Treatment", color: "text-sky-dark", bg: "bg-sky/10" },
  "special-needs": { label: "Special", color: "text-red-700", bg: "bg-red-50" },
  "hoof-dental": { label: "Hoof/Dental", color: "text-purple-700", bg: "bg-purple-50" },
  weight: { label: "Weight", color: "text-sky-700", bg: "bg-sky-50" },
  sponsor: { label: "Sponsor", color: "text-pink-700", bg: "bg-pink-50" },
  projects: { label: "Projects", color: "text-indigo-700", bg: "bg-indigo-50" },
  admin: { label: "Admin", color: "text-slate-700", bg: "bg-slate-100" },
  care: { label: "Care", color: "text-emerald-700", bg: "bg-emerald-50" },
  ranch: { label: "Ranch", color: "text-amber-800", bg: "bg-amber-100" },
};

// ── Source labels for auto-generated badge ──
export const sourceMeta: Record<TaskSource, { label: string; badge: boolean }> = {
  base: { label: "Whiteboard", badge: false },
  "watch-list": { label: "Watch List", badge: true },
  "feed-schedule": { label: "Feed Schedule", badge: true },
  "hoof-dental": { label: "Hoof/Dental Due", badge: true },
  weight: { label: "Weight Due", badge: true },
  sponsor: { label: "Sponsor Update", badge: true },
  manual: { label: "Just Added", badge: true },
};

// ── Alley Herd Rotation (dummy data removed) ──
export const alleyHerdRotation: { date: string; herd: string }[] = [];

// ── Salts & Minerals Schedule ──
export const saltsAndMinerals = { days: ["Sunday", "Wednesday"] };
