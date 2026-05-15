"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Search,
  X,
  Plus,
  Users,
  Clock,
  ClipboardCheck,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Check,
  Phone,
  Mail,
  Calendar,
  Shield,
  Trash2,
  Pencil,
  Save,
} from "lucide-react";
import {
  volunteers as initialVolunteers,
  getVolunteerStats,
  statusMeta,
  roleMeta,
  allSkills,
  type Volunteer,
  type VolunteerStatus,
  type VolunteerTask,
  type DayOfWeek,
  type UserRole,
} from "@/lib/volunteer-data";
import { formatDate } from "@/lib/format-date";

// ── Helpers ──
// (formatDate is imported from @/lib/format-date at the top of the file.)

const allDays: DayOfWeek[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ── Page ──

// API ↔ UI mapping. The DB stores emergency contact as flat columns; the UI
// model nests them and also tracks per-volunteer tasks (tasks are client-only
// for now — no DB column).
interface ApiVolunteer {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  startDate: string;
  availability: string[];
  skills: string[];
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelation: string;
  notes: string;
  hoursThisMonth: number;
  committedHoursPerDay: number;
}

function fromApi(row: ApiVolunteer): Volunteer {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role as UserRole,
    status: row.status as VolunteerStatus,
    startDate: row.startDate,
    availability: row.availability as DayOfWeek[],
    skills: row.skills,
    emergencyContact: {
      name: row.emergencyName,
      phone: row.emergencyPhone,
      relation: row.emergencyRelation,
    },
    notes: row.notes,
    hoursThisMonth: row.hoursThisMonth,
    committedHoursPerDay: row.committedHoursPerDay,
    tasks: [],
  };
}

function toApiPayload(v: Partial<Volunteer> & { id?: string }): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (v.id !== undefined) out.id = v.id;
  if (v.name !== undefined) out.name = v.name;
  if (v.email !== undefined) out.email = v.email;
  if (v.phone !== undefined) out.phone = v.phone;
  if (v.role !== undefined) out.role = v.role;
  if (v.status !== undefined) out.status = v.status;
  if (v.startDate !== undefined) out.startDate = v.startDate;
  if (v.availability !== undefined) out.availability = v.availability;
  if (v.skills !== undefined) out.skills = v.skills;
  if (v.emergencyContact !== undefined) {
    out.emergencyName = v.emergencyContact.name;
    out.emergencyPhone = v.emergencyContact.phone;
    out.emergencyRelation = v.emergencyContact.relation;
  }
  if (v.notes !== undefined) out.notes = v.notes;
  if (v.hoursThisMonth !== undefined) out.hoursThisMonth = v.hoursThisMonth;
  if (v.committedHoursPerDay !== undefined) out.committedHoursPerDay = v.committedHoursPerDay;
  return out;
}

export default function VolunteersPage() {
  const [localVolunteers, setLocalVolunteers] = useState<Volunteer[]>(initialVolunteers);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<VolunteerStatus | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Add form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formAvailability, setFormAvailability] = useState<DayOfWeek[]>([]);
  const [formSkills, setFormSkills] = useState<string[]>([]);
  const [formNotes, setFormNotes] = useState("");
  const [formEmergName, setFormEmergName] = useState("");
  const [formEmergPhone, setFormEmergPhone] = useState("");
  const [formEmergRelation, setFormEmergRelation] = useState("");

  // Task assignment form state
  const [taskVolunteerId, setTaskVolunteerId] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDate, setTaskDate] = useState("2026-04-01");
  const [taskNotes, setTaskNotes] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAvailability, setEditAvailability] = useState<DayOfWeek[]>([]);
  const [editSkills, setEditSkills] = useState<string[]>([]);
  const [editNotes, setEditNotes] = useState("");
  const [editEmergName, setEditEmergName] = useState("");
  const [editEmergPhone, setEditEmergPhone] = useState("");
  const [editEmergRelation, setEditEmergRelation] = useState("");
  const [editHours, setEditHours] = useState("");

  // ── Load from DB on mount, fall back to seed data on failure ──
  useEffect(() => {
    let cancelled = false;
    fetch("/api/volunteers", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then((data: { volunteers: ApiVolunteer[] }) => {
        if (cancelled) return;
        if (Array.isArray(data.volunteers) && data.volunteers.length > 0) {
          setLocalVolunteers(data.volunteers.map(fromApi));
        }
      })
      .catch(() => {
        // Stay with the seed data if the API isn't reachable yet.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist a single volunteer via POST (upsert by email). Used on add and on
  // edit so the same write path covers both create-from-seed and update-existing.
  const persistVolunteer = useCallback(async (vol: Volunteer) => {
    try {
      setSaveError(null);
      const res = await fetch("/api/volunteers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toApiPayload(vol)),
      });
      if (!res.ok) throw new Error(await res.text());
      const data: { volunteer: ApiVolunteer } = await res.json();
      const saved = fromApi(data.volunteer);
      // Replace the optimistic record with the server's canonical one (so the
      // server-assigned id replaces our temporary "vol-<timestamp>" id).
      setLocalVolunteers((prev) => {
        const byEmail = prev.findIndex((v) => v.email === saved.email);
        if (byEmail === -1) return [...prev, saved];
        const next = [...prev];
        next[byEmail] = { ...saved, tasks: prev[byEmail].tasks };
        return next;
      });
    } catch (err) {
      console.error("Failed to save volunteer:", err);
      setSaveError("Couldn't save changes. Try again.");
    }
  }, []);

  const persistDelete = useCallback(async (id: string) => {
    try {
      setSaveError(null);
      const res = await fetch(`/api/volunteers?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await res.text());
    } catch (err) {
      console.error("Failed to delete volunteer:", err);
      setSaveError("Couldn't delete. Try again.");
    }
  }, []);

  function startEditing(vol: Volunteer) {
    setEditingId(vol.id);
    setEditName(vol.name);
    setEditEmail(vol.email);
    setEditPhone(vol.phone);
    setEditAvailability([...vol.availability]);
    setEditSkills([...vol.skills]);
    setEditNotes(vol.notes);
    setEditEmergName(vol.emergencyContact.name);
    setEditEmergPhone(vol.emergencyContact.phone);
    setEditEmergRelation(vol.emergencyContact.relation);
    setEditHours(String(vol.hoursThisMonth));
  }

  function handleSaveEdit() {
    if (!editingId || !editName.trim()) return;
    const target = localVolunteers.find((v) => v.id === editingId);
    if (!target) return;
    const updated: Volunteer = {
      ...target,
      name: editName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
      availability: editAvailability,
      skills: editSkills,
      notes: editNotes.trim(),
      emergencyContact: {
        name: editEmergName.trim(),
        phone: editEmergPhone.trim(),
        relation: editEmergRelation.trim(),
      },
      hoursThisMonth: parseInt(editHours) || 0,
    };
    // Optimistic update — replaced with server's canonical row by persistVolunteer.
    setLocalVolunteers((prev) =>
      prev.map((v) => (v.id === editingId ? updated : v))
    );
    setEditingId(null);
    void persistVolunteer(updated);
  }

  function toggleEditDay(day: DayOfWeek) {
    setEditAvailability((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function toggleEditSkill(skill: string) {
    setEditSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  }

  // Stats
  const stats = useMemo(() => {
    const active = localVolunteers.filter((v) => v.status === "active").length;
    const pending = localVolunteers.filter((v) => v.status === "pending").length;
    const totalHours = localVolunteers.reduce((sum, v) => sum + v.hoursThisMonth, 0);
    const openTasks = localVolunteers.reduce(
      (sum, v) => sum + v.tasks.filter((t) => !t.completed).length,
      0
    );
    return { active, pending, total: localVolunteers.length, totalHours, openTasks };
  }, [localVolunteers]);

  // Filter + search
  const filtered = useMemo(() => {
    let result = localVolunteers;
    if (filterStatus !== "all") result = result.filter((v) => v.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.email.toLowerCase().includes(q) ||
          v.skills.some((s) => s.toLowerCase().includes(q)) ||
          v.notes.toLowerCase().includes(q)
      );
    }
    return result;
  }, [localVolunteers, filterStatus, search]);

  // ── Actions ──

  function toggleDay(day: DayOfWeek) {
    setFormAvailability((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function toggleSkill(skill: string) {
    setFormSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  }

  function handleAddVolunteer() {
    if (!formName.trim()) return;
    const newVol: Volunteer = {
      id: `vol-${Date.now()}`,
      name: formName.trim(),
      email: formEmail.trim(),
      phone: formPhone.trim(),
      role: "volunteer" as UserRole,
      status: "pending",
      startDate: new Date().toISOString().split("T")[0],
      availability: formAvailability,
      skills: formSkills,
      emergencyContact: {
        name: formEmergName.trim(),
        phone: formEmergPhone.trim(),
        relation: formEmergRelation.trim(),
      },
      notes: formNotes.trim(),
      hoursThisMonth: 0,
      committedHoursPerDay: 3,
      tasks: [],
    };
    setLocalVolunteers((prev) => [...prev, newVol]);
    void persistVolunteer(newVol);
    // Reset form
    setFormName("");
    setFormEmail("");
    setFormPhone("");
    setFormAvailability([]);
    setFormSkills([]);
    setFormNotes("");
    setFormEmergName("");
    setFormEmergPhone("");
    setFormEmergRelation("");
    setShowAddForm(false);
  }

  function handleToggleStatus(id: string) {
    const target = localVolunteers.find((v) => v.id === id);
    if (!target) return;
    const nextStatus: VolunteerStatus =
      target.status === "active" ? "inactive" : "active";
    const updated = { ...target, status: nextStatus };
    setLocalVolunteers((prev) =>
      prev.map((v) => (v.id === id ? updated : v))
    );
    void persistVolunteer(updated);
  }

  function handleToggleTask(volId: string, taskId: string) {
    setLocalVolunteers((prev) =>
      prev.map((v) =>
        v.id === volId
          ? {
              ...v,
              tasks: v.tasks.map((t) =>
                t.id === taskId ? { ...t, completed: !t.completed } : t
              ),
            }
          : v
      )
    );
  }

  function handleAssignTask() {
    if (!taskVolunteerId || !taskTitle.trim()) return;
    const newTask: VolunteerTask = {
      id: `vt-${Date.now()}`,
      title: taskTitle.trim(),
      assignedDate: taskDate,
      completed: false,
      notes: taskNotes.trim(),
    };
    setLocalVolunteers((prev) =>
      prev.map((v) =>
        v.id === taskVolunteerId ? { ...v, tasks: [...v.tasks, newTask] } : v
      )
    );
    setTaskTitle("");
    setTaskNotes("");
    setTaskVolunteerId(null);
  }

  function handleRemoveVolunteer(id: string) {
    setLocalVolunteers((prev) => prev.filter((v) => v.id !== id));
    if (expandedId === id) setExpandedId(null);
    void persistDelete(id);
  }

  return (
    <div className="space-y-6">
        {saveError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2.5 flex items-center justify-between">
            <span>{saveError}</span>
            <button
              onClick={() => setSaveError(null)}
              className="text-red-500 hover:text-red-700"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {loading && (
          <div className="text-xs text-warm-gray">Loading volunteers…</div>
        )}
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-charcoal flex items-center gap-2">
              Admin
              <Shield className="w-5 h-5 text-sidebar/40" />
            </h1>
            <p className="text-sm text-warm-gray mt-1">
              Manage team members, volunteers, availability, and task assignments
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-sidebar text-white rounded-lg text-sm font-medium hover:bg-sidebar-light transition-colors"
          >
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddForm ? "Cancel" : "Add Volunteer"}
          </button>
        </div>

        {/* ══════ ADD VOLUNTEER FORM ══════ */}
        {showAddForm && (
          <div className="bg-white rounded-xl border border-card-border p-5 space-y-4">
            <h3 className="font-bold text-charcoal">New Volunteer</h3>

            {/* Basic info */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Full name"
                  className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="(555) 000-0000"
                  className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
                />
              </div>
            </div>

            {/* Availability */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-2">
                Availability
              </label>
              <div className="flex flex-wrap gap-2">
                {allDays.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      formAvailability.includes(day)
                        ? "bg-sidebar text-white border-sidebar"
                        : "bg-white text-charcoal border-card-border hover:border-sand"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-2">
                Skills
              </label>
              <div className="flex flex-wrap gap-2">
                {allSkills.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      formSkills.includes(skill)
                        ? "bg-sidebar text-white border-sidebar"
                        : "bg-white text-charcoal border-card-border hover:border-sand"
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            {/* Emergency contact */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-2">
                Emergency Contact
              </label>
              <div className="grid sm:grid-cols-3 gap-4">
                <input
                  type="text"
                  value={formEmergName}
                  onChange={(e) => setFormEmergName(e.target.value)}
                  placeholder="Contact name"
                  className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
                />
                <input
                  type="tel"
                  value={formEmergPhone}
                  onChange={(e) => setFormEmergPhone(e.target.value)}
                  placeholder="Contact phone"
                  className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
                />
                <input
                  type="text"
                  value={formEmergRelation}
                  onChange={(e) => setFormEmergRelation(e.target.value)}
                  placeholder="Relationship"
                  className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-1">
                Notes
              </label>
              <textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={2}
                placeholder="Experience, preferences, anything helpful..."
                className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal leading-relaxed focus:outline-none focus:ring-2 focus:ring-sand/50"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleAddVolunteer}
                disabled={!formName.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-sidebar text-white rounded-lg text-sm font-medium hover:bg-sidebar-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Add Volunteer
              </button>
            </div>
          </div>
        )}

        {/* ══════ STAT CARDS ══════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-card-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
                <p className="text-xs text-warm-gray font-medium">Active</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-card-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                <p className="text-xs text-warm-gray font-medium">Pending</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-card-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-sky-600">{stats.totalHours}</p>
                <p className="text-xs text-warm-gray font-medium">Hours This Month</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-card-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{stats.openTasks}</p>
                <p className="text-xs text-warm-gray font-medium">Open Tasks</p>
              </div>
            </div>
          </div>
        </div>

        {/* ══════ SEARCH + FILTER ══════ */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-gray/50" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search volunteers by name, skill, or notes..."
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-card-border rounded-xl text-sm text-charcoal placeholder:text-warm-gray/50 focus:outline-none focus:ring-2 focus:ring-sand/50 focus:border-sand"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-gray/50 hover:text-charcoal"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="relative shrink-0">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as VolunteerStatus | "all")}
              className="appearance-none pl-3 pr-8 py-3.5 text-sm border border-card-border rounded-xl text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-sand/50"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
            <ChevronDown className="w-4 h-4 text-warm-gray absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* ══════ VOLUNTEER LIST ══════ */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-card-border p-12 text-center">
            <Users className="w-10 h-10 text-warm-gray/30 mx-auto mb-3" />
            <p className="text-warm-gray font-medium">No volunteers found</p>
            <p className="text-sm text-warm-gray/60 mt-1">
              {search ? "Try adjusting your search" : "Add your first volunteer above"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((vol) => {
              const isExpanded = expandedId === vol.id;
              const meta = statusMeta[vol.status];
              const openTasks = vol.tasks.filter((t) => !t.completed).length;

              return (
                <div
                  key={vol.id}
                  className="bg-white rounded-xl border border-card-border overflow-hidden"
                >
                  {/* Summary row */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : vol.id)}
                    className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-cream/30 transition-colors"
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-sidebar/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-sidebar">
                        {vol.name.split(" ").map((n) => n[0]).join("")}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-charcoal">
                          {vol.name}
                        </span>
                        <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border ${roleMeta[vol.role].bg} ${roleMeta[vol.role].color}`}>
                          {roleMeta[vol.role].label}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${meta.bg} ${meta.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                          {meta.label}
                        </span>
                        {openTasks > 0 && (
                          <span className="text-[11px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                            {openTasks} task{openTasks !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-warm-gray">
                        <span>{vol.availability.join(", ")}</span>
                        <span className="hidden sm:inline">
                          {vol.hoursThisMonth}h this month
                        </span>
                      </div>
                    </div>

                    {/* Skills preview */}
                    <div className="hidden md:flex items-center gap-1.5">
                      {vol.skills.slice(0, 3).map((skill) => (
                        <span
                          key={skill}
                          className="text-[11px] font-medium text-warm-gray bg-cream px-2 py-0.5 rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                      {vol.skills.length > 3 && (
                        <span className="text-[11px] text-warm-gray/60">
                          +{vol.skills.length - 3}
                        </span>
                      )}
                    </div>

                    <ChevronRight
                      className={`w-4 h-4 text-warm-gray/40 transition-transform shrink-0 ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                    />
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-card-border bg-cream/20 px-5 py-5">
                      <div className="grid sm:grid-cols-2 gap-6">
                        {/* Left: Contact + Info */}
                        <div className="space-y-4">
                          {editingId === vol.id ? (
                            <>
                              {/* ── EDIT MODE ── */}
                              <div>
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-2">
                                  Basic Info
                                </h4>
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="Full name"
                                    className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
                                  />
                                  <div className="flex items-center gap-2">
                                    <Mail className="w-3.5 h-3.5 text-warm-gray/50 shrink-0" />
                                    <input
                                      type="email"
                                      value={editEmail}
                                      onChange={(e) => setEditEmail(e.target.value)}
                                      placeholder="Email"
                                      className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Phone className="w-3.5 h-3.5 text-warm-gray/50 shrink-0" />
                                    <input
                                      type="tel"
                                      value={editPhone}
                                      onChange={(e) => setEditPhone(e.target.value)}
                                      placeholder="Phone"
                                      className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5 text-warm-gray/50 shrink-0" />
                                    <input
                                      type="number"
                                      value={editHours}
                                      onChange={(e) => setEditHours(e.target.value)}
                                      placeholder="Hours this month"
                                      className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
                                    />
                                    <span className="text-xs text-warm-gray shrink-0">hrs/mo</span>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-2">
                                  Availability
                                </h4>
                                <div className="flex flex-wrap gap-1.5">
                                  {allDays.map((day) => (
                                    <button
                                      key={day}
                                      type="button"
                                      onClick={() => toggleEditDay(day)}
                                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                                        editAvailability.includes(day)
                                          ? "bg-sidebar text-white border-sidebar"
                                          : "bg-white text-charcoal border-card-border hover:border-sand"
                                      }`}
                                    >
                                      {day}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-2">
                                  Emergency Contact
                                </h4>
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    value={editEmergName}
                                    onChange={(e) => setEditEmergName(e.target.value)}
                                    placeholder="Contact name"
                                    className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
                                  />
                                  <div className="grid grid-cols-2 gap-2">
                                    <input
                                      type="tel"
                                      value={editEmergPhone}
                                      onChange={(e) => setEditEmergPhone(e.target.value)}
                                      placeholder="Contact phone"
                                      className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
                                    />
                                    <input
                                      type="text"
                                      value={editEmergRelation}
                                      onChange={(e) => setEditEmergRelation(e.target.value)}
                                      placeholder="Relationship"
                                      className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-2">
                                  Skills
                                </h4>
                                <div className="flex flex-wrap gap-1.5">
                                  {allSkills.map((skill) => (
                                    <button
                                      key={skill}
                                      type="button"
                                      onClick={() => toggleEditSkill(skill)}
                                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                                        editSkills.includes(skill)
                                          ? "bg-sidebar text-white border-sidebar"
                                          : "bg-white text-charcoal border-card-border hover:border-sand"
                                      }`}
                                    >
                                      {skill}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-2">
                                  Notes
                                </h4>
                                <textarea
                                  value={editNotes}
                                  onChange={(e) => setEditNotes(e.target.value)}
                                  rows={2}
                                  placeholder="Experience, preferences, anything helpful..."
                                  className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal leading-relaxed focus:outline-none focus:ring-2 focus:ring-sand/50"
                                />
                              </div>

                              {/* Save / Cancel */}
                              <div className="flex items-center gap-2 pt-2">
                                <button
                                  onClick={handleSaveEdit}
                                  disabled={!editName.trim()}
                                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-sidebar text-white hover:bg-sidebar-light transition-colors disabled:opacity-40"
                                >
                                  <Save className="w-3 h-3" />
                                  Save Changes
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="text-xs font-medium px-3 py-1.5 rounded-lg border border-card-border text-warm-gray hover:bg-gray-50 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              {/* ── READ MODE ── */}
                              <div>
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-2">
                                  Contact
                                </h4>
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2 text-sm">
                                    <Mail className="w-3.5 h-3.5 text-warm-gray/50" />
                                    <span className="text-charcoal">{vol.email || "—"}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <Phone className="w-3.5 h-3.5 text-warm-gray/50" />
                                    <span className="text-charcoal">{vol.phone || "—"}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="w-3.5 h-3.5 text-warm-gray/50" />
                                    <span className="text-warm-gray">
                                      Started {formatDate(vol.startDate)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-2">
                                  Emergency Contact
                                </h4>
                                {vol.emergencyContact.name ? (
                                  <div className="text-sm space-y-0.5">
                                    <p className="font-medium text-charcoal">
                                      {vol.emergencyContact.name}{" "}
                                      <span className="text-warm-gray font-normal">
                                        ({vol.emergencyContact.relation})
                                      </span>
                                    </p>
                                    <p className="text-warm-gray">{vol.emergencyContact.phone}</p>
                                  </div>
                                ) : (
                                  <p className="text-sm text-warm-gray/50">Not provided</p>
                                )}
                              </div>

                              <div>
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-2">
                                  Skills
                                </h4>
                                <div className="flex flex-wrap gap-1.5">
                                  {vol.skills.map((skill) => (
                                    <span
                                      key={skill}
                                      className="text-xs font-medium bg-cream text-charcoal px-2.5 py-1 rounded-full"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {vol.notes && (
                                <div>
                                  <h4 className="text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-2">
                                    Notes
                                  </h4>
                                  <p className="text-sm text-warm-gray leading-relaxed">
                                    {vol.notes}
                                  </p>
                                </div>
                              )}

                              {/* Actions */}
                              <div className="flex items-center gap-2 pt-2">
                                <button
                                  onClick={() => startEditing(vol)}
                                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-sidebar/20 text-sidebar bg-sidebar/5 hover:bg-sidebar/10 transition-colors"
                                >
                                  <Pencil className="w-3 h-3" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleToggleStatus(vol.id)}
                                  className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                                    vol.status === "active"
                                      ? "text-warm-gray border-card-border hover:bg-gray-50"
                                      : "text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
                                  }`}
                                >
                                  {vol.status === "active" ? "Mark Inactive" : "Mark Active"}
                                </button>
                                <button
                                  onClick={() => handleRemoveVolunteer(vol.id)}
                                  className="text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3 inline mr-1" />
                                  Remove
                                </button>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Right: Tasks */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-warm-gray/60">
                              Assigned Tasks
                            </h4>
                            <button
                              onClick={() =>
                                setTaskVolunteerId(
                                  taskVolunteerId === vol.id ? null : vol.id
                                )
                              }
                              className="text-xs font-medium text-sidebar hover:text-sidebar-light transition-colors"
                            >
                              {taskVolunteerId === vol.id ? "Cancel" : "+ Add Task"}
                            </button>
                          </div>

                          {/* Add task form */}
                          {taskVolunteerId === vol.id && (
                            <div className="bg-white rounded-lg border border-card-border p-3 space-y-2">
                              <input
                                type="text"
                                value={taskTitle}
                                onChange={(e) => setTaskTitle(e.target.value)}
                                placeholder="Task description..."
                                className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <input
                                  type="date"
                                  value={taskDate}
                                  onChange={(e) => setTaskDate(e.target.value)}
                                  className="flex-1 px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
                                />
                                <input
                                  type="text"
                                  value={taskNotes}
                                  onChange={(e) => setTaskNotes(e.target.value)}
                                  placeholder="Notes (optional)"
                                  className="flex-1 px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
                                />
                              </div>
                              <button
                                onClick={handleAssignTask}
                                disabled={!taskTitle.trim()}
                                className="w-full px-3 py-2 bg-sidebar text-white rounded-lg text-sm font-medium hover:bg-sidebar-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                Assign Task
                              </button>
                            </div>
                          )}

                          {/* Task list */}
                          {vol.tasks.length === 0 ? (
                            <p className="text-sm text-warm-gray/50 py-4 text-center">
                              No tasks assigned
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {vol.tasks.map((task) => (
                                <button
                                  key={task.id}
                                  onClick={() => handleToggleTask(vol.id, task.id)}
                                  className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                                    task.completed
                                      ? "bg-emerald-50/50 border-emerald-200"
                                      : "bg-white border-card-border hover:border-sand"
                                  }`}
                                >
                                  <div
                                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                      task.completed
                                        ? "bg-emerald-500 border-emerald-500"
                                        : "border-card-border"
                                    }`}
                                  >
                                    {task.completed && (
                                      <Check className="w-3 h-3 text-white" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p
                                      className={`text-sm font-medium ${
                                        task.completed
                                          ? "text-warm-gray line-through"
                                          : "text-charcoal"
                                      }`}
                                    >
                                      {task.title}
                                    </p>
                                    <p className="text-xs text-warm-gray mt-0.5">
                                      {formatDate(task.assignedDate)}
                                      {task.notes && ` — ${task.notes}`}
                                    </p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
  );
}
