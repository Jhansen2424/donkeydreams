// ── Types ──

export type VolunteerStatus = "active" | "inactive" | "pending";
export type DayOfWeek = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export interface VolunteerTask {
  id: string;
  title: string;
  assignedDate: string; // ISO date
  completed: boolean;
  notes: string;
}

export type UserRole = "admin" | "volunteer";

export interface Volunteer {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: VolunteerStatus;
  startDate: string; // ISO date
  availability: DayOfWeek[];
  skills: string[];
  emergencyContact: { name: string; phone: string; relation: string };
  notes: string;
  hoursThisMonth: number;
  committedHoursPerDay: number; // daily time commitment in hours
  tasks: VolunteerTask[];
}

export const roleMeta: Record<UserRole, { label: string; color: string; bg: string }> = {
  admin: { label: "Admin", color: "text-red-700", bg: "bg-red-50 border-red-200" },
  volunteer: { label: "Volunteer", color: "text-sky-700", bg: "bg-sky-50 border-sky-200" },
};

// ── Display helpers ──

export const statusMeta: Record<VolunteerStatus, { label: string; color: string; bg: string; dot: string }> = {
  active: { label: "Active", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
  inactive: { label: "Inactive", color: "text-warm-gray", bg: "bg-gray-100 border-gray-300", dot: "bg-gray-400" },
  pending: { label: "Pending", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", dot: "bg-amber-500" },
};

export const allSkills = [
  "Feeding",
  "Grooming",
  "Mucking",
  "Hoof Picking",
  "Medical Assist",
  "Photography",
  "Events",
  "Fencing/Repair",
  "Transport",
  "Admin",
];

// ── Dummy data ──

export const volunteers: Volunteer[] = [
  {
    id: "admin-1",
    name: "Edj Fish",
    email: "edj@donkeydreams.org",
    phone: "",
    role: "admin",
    status: "active",
    startDate: "2023-01-01",
    availability: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    skills: ["Feeding", "Grooming", "Mucking", "Hoof Picking", "Medical Assist", "Fencing/Repair", "Transport", "Admin"],
    emergencyContact: { name: "Amber", phone: "", relation: "Partner" },
    notes: "Co-founder. Manages all sanctuary operations, feeding schedules, and medical care.",
    hoursThisMonth: 0,
    committedHoursPerDay: 8,
    tasks: [],
  },
  {
    id: "admin-2",
    name: "Amber",
    email: "amber@donkeydreams.org",
    phone: "",
    role: "admin",
    status: "active",
    startDate: "2023-01-01",
    availability: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    skills: ["Feeding", "Grooming", "Medical Assist", "Photography", "Events", "Admin"],
    emergencyContact: { name: "Edj Fish", phone: "", relation: "Partner" },
    notes: "Co-founder. Handles sponsor communications, social media, virtual visits, and events.",
    hoursThisMonth: 0,
    committedHoursPerDay: 8,
    tasks: [],
  },
  {
    id: "vol-1",
    name: "Rachel Green",
    email: "rachel.g@example.com",
    phone: "(555) 123-4567",
    role: "volunteer",
    status: "active",
    startDate: "2025-09-15",
    availability: ["Sat", "Sun"],
    skills: ["Feeding", "Grooming", "Photography"],
    emergencyContact: { name: "Monica Geller", phone: "(555) 234-5678", relation: "Friend" },
    notes: "Very good with the senior donkeys. Comfortable administering supplements.",
    hoursThisMonth: 24,
    committedHoursPerDay: 3,
    tasks: [
      { id: "vt-1", title: "Photograph new arrivals for sponsor updates", assignedDate: "2026-03-28", completed: true, notes: "" },
      { id: "vt-2", title: "Help with Saturday morning feeding", assignedDate: "2026-04-05", completed: false, notes: "Knows the feed bucket routine" },
    ],
  },
  {
    id: "vol-2",
    name: "Marcus Chen",
    email: "marcus.c@example.com",
    phone: "(555) 345-6789",
    role: "volunteer",
    status: "active",
    startDate: "2025-06-01",
    availability: ["Wed", "Thu", "Sat"],
    skills: ["Mucking", "Fencing/Repair", "Hoof Picking", "Transport"],
    emergencyContact: { name: "Lisa Chen", phone: "(555) 456-7890", relation: "Spouse" },
    notes: "Has his own truck for hay pickups. Farrier experience — can assist with hoof trims.",
    hoursThisMonth: 32,
    committedHoursPerDay: 4,
    tasks: [
      { id: "vt-3", title: "Fence repair on east pasture", assignedDate: "2026-04-02", completed: false, notes: "Posts and wire in barn storage" },
      { id: "vt-4", title: "Hay delivery pickup from McCoy's", assignedDate: "2026-04-03", completed: false, notes: "20 bales, bring truck" },
    ],
  },
  {
    id: "vol-3",
    name: "Sophie Baker",
    email: "sophie.b@example.com",
    phone: "(555) 567-8901",
    role: "volunteer",
    status: "active",
    startDate: "2026-01-10",
    availability: ["Mon", "Fri"],
    skills: ["Feeding", "Grooming", "Events", "Admin"],
    emergencyContact: { name: "Tom Baker", phone: "(555) 678-9012", relation: "Father" },
    notes: "College student — available during breaks for extra shifts. Great with social media.",
    hoursThisMonth: 16,
    committedHoursPerDay: 3,
    tasks: [
      { id: "vt-5", title: "Draft April newsletter sponsor section", assignedDate: "2026-04-01", completed: false, notes: "" },
    ],
  },
  {
    id: "vol-4",
    name: "Jim Halpert",
    email: "jim.h@example.com",
    phone: "(555) 789-0123",
    role: "volunteer",
    status: "pending",
    startDate: "2026-03-25",
    availability: ["Sat"],
    skills: ["Mucking", "Feeding"],
    emergencyContact: { name: "Pam Halpert", phone: "(555) 890-1234", relation: "Spouse" },
    notes: "New volunteer — needs orientation. Interested in adoption eventually.",
    hoursThisMonth: 0,
    committedHoursPerDay: 2,
    tasks: [
      { id: "vt-6", title: "Complete volunteer orientation", assignedDate: "2026-04-05", completed: false, notes: "Shadow Rachel on Saturday shift" },
    ],
  },
];

// ── Stats ──

export function getVolunteerStats() {
  const active = volunteers.filter((v) => v.status === "active").length;
  const pending = volunteers.filter((v) => v.status === "pending").length;
  const totalHours = volunteers.reduce((sum, v) => sum + v.hoursThisMonth, 0);
  const openTasks = volunteers.reduce(
    (sum, v) => sum + v.tasks.filter((t) => !t.completed).length,
    0
  );
  return { active, pending, total: volunteers.length, totalHours, openTasks };
}
