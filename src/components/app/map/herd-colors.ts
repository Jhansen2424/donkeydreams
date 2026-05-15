// Canonical color per herd for map polygons + legend. Picked to be readable
// on a satellite/outdoor base map (high enough saturation, distinct from each
// other). If a pen's herd isn't in this table it falls back to slate.
export const HERD_COLORS: Record<string, string> = {
  Angels: "#ec4899",      // pink
  Brave: "#3b82f6",       // blue
  Dragons: "#8b5cf6",     // violet
  "Elsie's Herd": "#10b981", // emerald
  Legacy: "#f59e0b",      // amber
  Pegasus: "#06b6d4",     // cyan
  "Pinky's Herd": "#f43f5e", // rose
  Seniors: "#a855f7",     // purple
  Unicorns: "#eab308",    // yellow
};

export function colorForHerd(herd: string): string {
  return HERD_COLORS[herd] ?? "#64748b"; // slate fallback
}
