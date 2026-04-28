// Centralized date formatters. The dev team standardized on MM-DD-YYYY for
// all UI display. Use these helpers everywhere instead of inline
// `toLocaleDateString("en-US", { month: "short", … })` calls so the format
// stays consistent and a future change is one edit, not 25.

/**
 * Full MM-DD-YYYY format. Pass an ISO date string ("2026-04-28") or a Date.
 * Returns "04-28-2026" (zero-padded).
 */
export function formatDate(input: string | Date | null | undefined): string {
  if (!input) return "—";
  const d =
    typeof input === "string"
      ? new Date(input + "T00:00:00")
      : input;
  if (isNaN(d.getTime())) return "—";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}-${dd}-${yyyy}`;
}

/**
 * Short MM-DD format without year — handy for compact lists where the year
 * is implied by context. Returns "04-28".
 */
export function formatDateShort(input: string | Date | null | undefined): string {
  if (!input) return "—";
  const d =
    typeof input === "string"
      ? new Date(input + "T00:00:00")
      : input;
  if (isNaN(d.getTime())) return "—";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}-${dd}`;
}
