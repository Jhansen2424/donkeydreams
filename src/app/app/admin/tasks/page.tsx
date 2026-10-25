"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ClipboardCheck, Plus, Printer, Search, X, ChevronDown, ChevronRight } from "lucide-react";
import { AdminGate, useAdminAccess } from "@/components/app/AdminGate";
import { AdminTaskForm, AdminTaskRow } from "@/components/app/AdminTaskParts";
import { useAdminTasks, sortAdminTasks, dueStatus, REPEAT_LABEL, type AdminTask } from "@/lib/admin-tasks";
import { localToday } from "@/lib/schedule-context";
import { formatDate } from "@/lib/format-date";
import { useToast } from "@/lib/toast-context";

// Every admin task on one page (client 10/24: adding them all pushed the
// rest of the admin dashboard down). The dashboard shows a short preview and
// links here. Grouped by when they're due, editable, and printable.

const SECTIONS: { key: "overdue" | "week" | "later" | "none"; title: string; tone: string }[] = [
  { key: "overdue", title: "Overdue", tone: "text-red-700" },
  { key: "week", title: "Due today and this week", tone: "text-amber-700" },
  { key: "later", title: "Coming up later", tone: "text-purple-700" },
  { key: "none", title: "No due date", tone: "text-indigo-700" },
];

function sectionOf(t: AdminTask, today: string) {
  const s = dueStatus(t.dueDate, today);
  if (s === "overdue") return "overdue";
  if (s === "today" || s === "soon") return "week";
  if (s === "later") return "later";
  return "none";
}

export default function AdminTasksPage() {
  const admin = useAdminAccess();
  const { tasks, loading, error, add, update, toggle, remove } = useAdminTasks();
  const { toastSuccess, toastError } = useToast();
  const today = localToday();
  // "Add" on the admin dashboard opens this page with the form ready.
  const searchParams = useSearchParams();
  const [showAdd, setShowAdd] = useState(() => searchParams.get("add") === "1");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [showDone, setShowDone] = useState(false);

  // "Print" on the admin dashboard opens this page and prints once loaded.
  const printed = useRef(false);
  useEffect(() => {
    if (printed.current || loading || !admin.unlocked || searchParams.get("print") !== "1") return;
    printed.current = true;
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, [loading, admin.unlocked, searchParams]);

  const sorted = useMemo(() => sortAdminTasks(tasks), [tasks]);
  const query = q.trim().toLowerCase();
  const matches = (t: AdminTask) =>
    !query || `${t.task} ${t.note ?? ""} ${t.assignedTo ?? ""}`.toLowerCase().includes(query);
  const open = sorted.filter((t) => !t.done);
  const done = sorted.filter((t) => t.done);
  const overdue = open.filter((t) => dueStatus(t.dueDate, today) === "overdue").length;

  const onToggle = async (t: AdminTask) => {
    const ok = await toggle(t.id);
    if (!ok) toastError("Couldn't update the task. Check your signal and try again.");
    else if (!t.done && t.repeat) toastSuccess("Done. The next one has been added.");
  };
  const onDelete = async (t: AdminTask) => {
    if (!window.confirm(`Delete "${t.task}"?`)) return;
    const ok = await remove(t.id);
    if (!ok) toastError("Couldn't delete the task. Try again.");
  };

  const row = (t: AdminTask) =>
    editingId === t.id ? (
      <li key={t.id}>
        <AdminTaskForm
          initial={t}
          today={today}
          saveLabel="Save changes"
          onCancel={() => setEditingId(null)}
          onSave={async (input) => {
            const ok = await update(t.id, input);
            if (ok) setEditingId(null);
            else toastError("Couldn't save the changes. Try again.");
            return ok;
          }}
        />
      </li>
    ) : (
      <AdminTaskRow
        key={t.id}
        task={t}
        today={today}
        onToggle={() => void onToggle(t)}
        onEdit={() => setEditingId(t.id)}
        onDelete={() => void onDelete(t)}
      />
    );

  return (
    <AdminGate unlocked={admin.unlocked} pin={admin.pin} setPin={admin.setPin} setUnlocked={admin.setUnlocked}>
      {/* ── Screen ── */}
      <div className="space-y-5 print:hidden">
        <Link href="/app/admin" className="inline-flex items-center gap-1.5 text-sm text-warm-gray hover:text-charcoal">
          <ArrowLeft className="w-4 h-4" />
          Admin
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-charcoal flex items-center gap-2">
              <ClipboardCheck className="w-6 h-6 text-purple-600" />
              Admin Tasks
            </h1>
            <p className="text-sm text-warm-gray mt-0.5">
              {open.length} open{overdue > 0 && <span className="text-red-700 font-medium"> · {overdue} overdue</span>}
              {" · "}only visible to admins, never on the daily routine
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium bg-white border border-card-border text-charcoal hover:bg-cream"
            >
              <Printer className="w-4 h-4" />
              Print / Save as PDF
            </button>
            <button
              type="button"
              onClick={() => setShowAdd((v) => !v)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium bg-sidebar text-white hover:bg-sidebar-light"
            >
              <Plus className="w-4 h-4" />
              Add task
            </button>
          </div>
        </div>

        {showAdd && (
          <AdminTaskForm
            today={today}
            saveLabel="Add task"
            onCancel={() => setShowAdd(false)}
            onSave={async (input) => {
              const ok = await add(input);
              if (ok) {
                toastSuccess("Admin task added");
                setShowAdd(false);
              } else toastError("Couldn't add the task. Try again.");
              return ok;
            }}
          />
        )}

        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-warm-gray absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search admin tasks"
            className="w-full pl-9 pr-9 py-2.5 rounded-lg border border-card-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sidebar/30"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-warm-gray hover:text-charcoal"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        {!loading && open.length === 0 && !query && (
          <div className="rounded-xl border border-card-border bg-white px-5 py-10 text-center text-sm text-warm-gray">
            No open admin tasks. Add standing items like grant deadlines or yearly filings.
          </div>
        )}

        {SECTIONS.map((s) => {
          const items = open.filter((t) => sectionOf(t, today) === s.key && matches(t));
          if (!items.length) return null;
          return (
            <section key={s.key} className="space-y-2">
              <h2 className={`text-[11px] font-semibold uppercase tracking-wider ${s.tone}`}>
                {s.title} <span className="text-warm-gray/60">({items.length})</span>
              </h2>
              <ul className="space-y-1.5">{items.map(row)}</ul>
            </section>
          );
        })}

        {done.length > 0 && (
          <section className="space-y-2">
            <button
              type="button"
              onClick={() => setShowDone((v) => !v)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-warm-gray/70 hover:text-charcoal"
            >
              {showDone ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              Finished in the last 60 days ({done.filter(matches).length})
            </button>
            {showDone && <ul className="space-y-1.5">{done.filter(matches).map(row)}</ul>}
          </section>
        )}
      </div>

      {/* ── Print ── */}
      <div className="hidden print:block text-black">
        <h1 className="text-xl font-bold">Donkey Dreams Sanctuary: Admin Tasks</h1>
        <p className="text-xs mb-4">
          Printed {formatDate(today)} · {open.length} open{overdue > 0 ? ` · ${overdue} overdue` : ""}
        </p>
        {SECTIONS.map((s) => {
          const items = open.filter((t) => sectionOf(t, today) === s.key && matches(t));
          if (!items.length) return null;
          return (
            <div key={s.key} className="mb-4 break-inside-avoid-page">
              <h2 className="text-sm font-bold uppercase tracking-wide border-b border-black pb-0.5 mb-1.5">
                {s.title}
              </h2>
              <ul className="space-y-2">
                {items.map((t) => (
                  <li key={t.id} className="flex gap-2.5 break-inside-avoid">
                    <span className="mt-0.5 w-3.5 h-3.5 border border-black shrink-0" />
                    <div className="text-sm">
                      <p className="font-semibold">{t.task}</p>
                      <p className="text-xs">
                        {[
                          t.dueDate && `Due ${formatDate(t.dueDate)}`,
                          t.repeat && REPEAT_LABEL[t.repeat],
                          t.assignedTo,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {t.note && <p className="text-xs whitespace-pre-wrap mt-0.5">{t.note}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </AdminGate>
  );
}
