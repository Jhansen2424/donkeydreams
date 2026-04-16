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

// ── Volunteers (seed list — mirrors the 3 admin rows in Neon) ──

export const volunteers: Volunteer[] = [
  {
    id: "v-edj",
    name: "Edj Fish",
    email: "edj@donkeydreams.org",
    phone: '',
    role: 'admin',
    status: 'active',
    startDate: "2026-04-16",
    availability: [],
    skills: [],
    emergencyContact: { name: '', phone: '', relation: '' },
    notes: '',
    hoursThisMonth: 0,
    committedHoursPerDay: 0,
    tasks: [],
  },
  {
    id: "v-amber",
    name: "Amber",
    email: "amber@donkeydreams.org",
    phone: '',
    role: 'admin',
    status: 'active',
    startDate: "2026-04-16",
    availability: [],
    skills: [],
    emergencyContact: { name: '', phone: '', relation: '' },
    notes: '',
    hoursThisMonth: 0,
    committedHoursPerDay: 0,
    tasks: [],
  },
  {
    id: "v-josh",
    name: "Josh",
    email: "joshua@webaholics.co",
    phone: '',
    role: 'admin',
    status: 'active',
    startDate: "2026-04-16",
    availability: [],
    skills: [],
    emergencyContact: { name: '', phone: '', relation: '' },
    notes: '',
    hoursThisMonth: 0,
    committedHoursPerDay: 0,
    tasks: [],
  },
];
// Dummy volunteers removed. This is a seed list matching the 3 admins in
// Neon. Will be replaced by a live DB fetch in a later phase.

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
