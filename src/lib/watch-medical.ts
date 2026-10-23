/** A watch alert's issue + plan, written up for the donkey's medical record. */
export function watchToMedicalText(issue: string, plan?: string): string {
  const lines = [`Issue: ${issue.trim()}`];
  if (plan?.trim()) lines.push(`Treatment / plan: ${plan.trim()}`);
  lines.push("(Copied from the watch list.)");
  return lines.join("\n");
}
