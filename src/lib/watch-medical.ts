/**
 * A short title for a watch alert copied to the medical record: its first
 * sentence, cut at a word (client 10/24: Dawn's came out as "...Since she
 * has a hi", hard to spot among her records).
 */
export function watchMedicalTitle(issue: string): string {
  const text = issue.trim().replace(/\s+/g, " ");
  const first = text.match(/^.+?[.!?](?=\s|$)/)?.[0] ?? text;
  if (first.length <= 70) return first.replace(/[.!?]$/, "");
  const cut = first.slice(0, 70);
  return cut.slice(0, Math.max(cut.lastIndexOf(" "), 40)).replace(/[,;:]$/, "") + "…";
}

/** A watch alert's issue + plan, written up for the donkey's medical record. */
export function watchToMedicalText(issue: string, plan?: string): string {
  const lines = [`Issue: ${issue.trim()}`];
  if (plan?.trim()) lines.push(`Treatment / plan: ${plan.trim()}`);
  lines.push("(Copied from the watch list.)");
  return lines.join("\n");
}
