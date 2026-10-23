// The staff app keeps the last copy of each data list on the phone, so a
// screen opens instantly with what was there last time and then refreshes in
// the background. On the yard's weak cell signal (or none), people still see
// profiles, tasks and notes (client 10/22: "an app lite version that
// downloads animal profiles, tasks, etc."). Storage can be full, blocked or
// wiped, so every read and write is best-effort.

const PREFIX = "dd:cache:v1:";

export function readCache<T>(key: string): { data: T; savedAt: number } | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: T; savedAt: number };
    return parsed && "data" in parsed ? parsed : null;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ data, savedAt: Date.now() }));
  } catch {
    // Out of space: drop old day-by-day task copies and try once more.
    try {
      for (const k of Object.keys(localStorage)) {
        if (k.startsWith(PREFIX + "tasks:")) localStorage.removeItem(k);
      }
      localStorage.setItem(PREFIX + key, JSON.stringify({ data, savedAt: Date.now() }));
    } catch {
      // Give up quietly; the app still works online.
    }
  }
}

/** Keep only the most recent `keep` cached task days. */
export function pruneTaskDays(keep = 4): void {
  try {
    const days = Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX + "tasks:"))
      .sort();
    for (const k of days.slice(0, Math.max(0, days.length - keep))) localStorage.removeItem(k);
  } catch {
    // ignore
  }
}
