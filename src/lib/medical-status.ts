// Which medical entries are reminders (something still to do) and whether
// one is done or overdue. Shared by the Medical page and donkey profiles so
// they agree.
//
// Client 11/6: Moses and Nelly Belle were vaccinated on 10/31, but their
// "Vaccination Overdue" reminders (built in from the deworming checklist,
// so not editable) stayed overdue forever. A reminder now counts as done once
// a matching treatment is logged for that donkey, and each reminder can be
// marked done directly.

import type { MedicalEntry } from "./medical-data";

/** How early a treatment can be given and still count for its reminder. */
const EARLY_DAYS = 45;

/** Reminder titles (built-in, the app's, and Joshy's vaccination ones). */
const REMINDER_TITLE = /^(vaccination overdue|upcoming vaccination|next vaccination due)$/i;

const shift = (iso: string, days: number) => {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/** A reminder of something to do (not a record of something done): the
 *  built-in scheduled vaccinations and any "— follow-up" entry. */
export function isReminder(r: MedicalEntry): boolean {
  return (
    r.id.startsWith("scheduled-") ||
    REMINDER_TITLE.test(r.title.trim()) ||
    /—\s*follow-up\s*$/i.test(r.title) ||
    /^Scheduled follow-up/i.test(r.description ?? "")
  );
}

/** The date of the treatment a follow-up was scheduled from, if recorded
 *  ("Scheduled follow-up for deworming on 2026-11-09."). */
function scheduledFrom(r: MedicalEntry): string | null {
  return (r.description ?? "").match(/^Scheduled follow-up[^\n]*?(\d{4}-\d{2}-\d{2})/i)?.[1] ?? null;
}

/** A reminder that's already taken care of: the same kind of treatment was
 *  logged for the same donkey on or after its due date (or a little early),
 *  up to today. */
export function isReminderDone(r: MedicalEntry, all: MedicalEntry[], todayIso: string): boolean {
  if (!isReminder(r)) return false;
  // Never let the treatment a follow-up was scheduled FROM count as doing
  // it (a dose due in two weeks isn't done by today's dose).
  const early = shift(r.date, -EARLY_DAYS);
  const source = scheduledFrom(r);
  const from = source && shift(source, 1) > early ? shift(source, 1) : early;
  return all.some(
    (o) => o !== r && o.animal === r.animal && o.type === r.type && !isReminder(o) && o.date >= from && o.date <= todayIso
  );
}

/** Past its date and still needing attention: an open reminder, or an
 *  entry flagged urgent. */
export function isOverdue(r: MedicalEntry, all: MedicalEntry[], todayIso: string): boolean {
  if (r.date >= todayIso) return false;
  if (isReminder(r)) return !isReminderDone(r, all, todayIso);
  return r.urgent;
}

/** The treatment's own name, without reminder wording. */
export function treatmentTitle(r: MedicalEntry): string {
  const t = r.title.replace(/\s*—\s*follow-up\s*$/i, "").trim();
  if (REMINDER_TITLE.test(t)) return "Vaccination";
  return t || r.type;
}

/** A sensible next due date after a treatment given on `doneIso`, or "". */
export function suggestedNextDue(type: string, title: string, doneIso: string): string {
  if (type === "Vaccination") return shift(doneIso, 365);
  if (type === "Hoof & Dental" && /dental/i.test(title)) return shift(doneIso, 365);
  return "";
}
