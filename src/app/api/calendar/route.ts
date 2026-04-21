import { NextRequest, NextResponse } from "next/server";

// Minimal iCal (RFC 5545) parser. We don't need to support every edge of the
// spec — just VEVENTs with DTSTART/DTEND/SUMMARY/DESCRIPTION/LOCATION and
// simple recurrence (DAILY/WEEKLY/MONTHLY RRULE with optional COUNT/UNTIL).
//
// The client posts the ICS URL in the request, or it can be configured via
// the CALENDAR_ICS_URL env var. We refuse to fetch non-http(s) URLs so an
// attacker can't coerce us into reading `file://` etc.

interface RawEvent {
  uid?: string;
  summary?: string;
  description?: string;
  location?: string;
  dtstart?: string;
  dtend?: string;
  rrule?: string;
  allDay?: boolean;
}

interface OutEvent {
  uid: string;
  time: string; // "9:00am" or "all-day"
  title: string;
  description: string;
  location: string;
  // inferred event type for the dashboard card's color palette
  type: "vet" | "farrier" | "event" | "task";
}

// Unfold continuation lines — lines starting with space or tab belong to
// the previous logical line.
function unfold(text: string): string[] {
  const raw = text.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  for (const line of raw) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && out.length > 0) {
      out[out.length - 1] += line.slice(1);
    } else {
      out.push(line);
    }
  }
  return out;
}

function parseIcsDate(value: string): { date: Date; allDay: boolean } | null {
  // Forms: "20260420T150000Z", "20260420T150000", "20260420"
  const m = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2}))?(Z)?$/);
  if (!m) return null;
  const [, y, mo, d, hh, mm, ss, z] = m;
  if (!hh) {
    // All-day date (local).
    return { date: new Date(Number(y), Number(mo) - 1, Number(d)), allDay: true };
  }
  const iso = `${y}-${mo}-${d}T${hh}:${mm}:${ss}${z === "Z" ? "Z" : ""}`;
  const dt = new Date(iso);
  if (isNaN(dt.getTime())) return null;
  return { date: dt, allDay: false };
}

function formatTime(d: Date): string {
  return d
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    .toLowerCase()
    .replace(" ", "");
}

function inferType(summary: string, description: string): OutEvent["type"] {
  const s = (summary + " " + description).toLowerCase();
  if (/\bvet|veterinar/i.test(s)) return "vet";
  if (/\bfarrier|trim|hoof\b/i.test(s)) return "farrier";
  if (/\btask|chore\b/i.test(s)) return "task";
  return "event";
}

function parseIcs(text: string): RawEvent[] {
  const lines = unfold(text);
  const events: RawEvent[] = [];
  let current: RawEvent | null = null;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      current = {};
    } else if (line === "END:VEVENT") {
      if (current) events.push(current);
      current = null;
    } else if (current) {
      // Split at the first `:` that isn't inside the property-parameter part.
      const idx = line.indexOf(":");
      if (idx === -1) continue;
      const rawKey = line.slice(0, idx);
      const value = line.slice(idx + 1);
      const key = rawKey.split(";")[0].toUpperCase();
      const params = rawKey.split(";").slice(1);
      switch (key) {
        case "UID":
          current.uid = value;
          break;
        case "SUMMARY":
          current.summary = unescapeText(value);
          break;
        case "DESCRIPTION":
          current.description = unescapeText(value);
          break;
        case "LOCATION":
          current.location = unescapeText(value);
          break;
        case "DTSTART":
          current.dtstart = value;
          if (params.some((p) => p.toUpperCase() === "VALUE=DATE")) current.allDay = true;
          break;
        case "DTEND":
          current.dtend = value;
          break;
        case "RRULE":
          current.rrule = value;
          break;
      }
    }
  }
  return events;
}

function unescapeText(v: string): string {
  return v
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

// Expand a single event into per-day occurrences that fall on `day` (local).
// Supports FREQ=DAILY|WEEKLY|MONTHLY with optional COUNT/UNTIL/INTERVAL/BYDAY.
function occursOn(ev: RawEvent, day: Date): Date | null {
  if (!ev.dtstart) return null;
  const start = parseIcsDate(ev.dtstart);
  if (!start) return null;

  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  // Single occurrence?
  if (!ev.rrule) {
    return start.date >= dayStart && start.date < dayEnd ? start.date : null;
  }

  // Recurrence.
  const params = new Map<string, string>();
  for (const part of ev.rrule.split(";")) {
    const [k, v] = part.split("=");
    if (k && v) params.set(k.toUpperCase(), v);
  }
  const freq = params.get("FREQ");
  const interval = Math.max(1, parseInt(params.get("INTERVAL") || "1", 10));
  const until = params.get("UNTIL") ? parseIcsDate(params.get("UNTIL")!)?.date : null;
  const count = params.get("COUNT") ? parseInt(params.get("COUNT")!, 10) : Infinity;
  if (until && dayStart > until) return null;

  const byDay = params.get("BYDAY")?.split(",");
  const weekdayMap: Record<string, number> = {
    SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6,
  };

  // Check if `dayStart` matches any instance of the recurrence. We iterate
  // from start until we pass the target day, counting instances.
  const candidate = new Date(start.date);
  // Preserve time-of-day from DTSTART on the candidate for the return value.
  let instances = 0;
  const MAX_ITER = 2000;
  for (let i = 0; i < MAX_ITER; i++) {
    if (candidate > dayEnd) break;
    const sameDay = candidate.getFullYear() === dayStart.getFullYear()
      && candidate.getMonth() === dayStart.getMonth()
      && candidate.getDate() === dayStart.getDate();

    // BYDAY filter (for WEEKLY): only count if weekday matches.
    const passesByDay = !byDay || byDay.some((d) => weekdayMap[d] === candidate.getDay());

    if (passesByDay) {
      instances += 1;
      if (instances > count) break;
      if (sameDay) {
        return new Date(candidate);
      }
    }

    // Step by FREQ*INTERVAL.
    if (freq === "DAILY") {
      candidate.setDate(candidate.getDate() + interval);
    } else if (freq === "WEEKLY") {
      candidate.setDate(candidate.getDate() + (byDay ? 1 : 7 * interval));
    } else if (freq === "MONTHLY") {
      candidate.setMonth(candidate.getMonth() + interval);
    } else if (freq === "YEARLY") {
      candidate.setFullYear(candidate.getFullYear() + interval);
    } else {
      break;
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams.get("url") || process.env.CALENDAR_ICS_URL;
    if (!url) {
      return NextResponse.json({ events: [], configured: false });
    }
    if (!/^https?:\/\//i.test(url)) {
      return NextResponse.json({ error: "Only http(s) URLs are allowed" }, { status: 400 });
    }

    const res = await fetch(url, {
      // iCal feeds are typically small; cache briefly.
      next: { revalidate: 300 },
      headers: { Accept: "text/calendar" },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Calendar fetch failed: ${res.status}` },
        { status: 502 }
      );
    }
    const text = await res.text();
    const raw = parseIcs(text);

    const today = new Date();
    const out: OutEvent[] = [];
    for (const ev of raw) {
      const when = occursOn(ev, today);
      if (!when) continue;
      const summary = ev.summary || "(no title)";
      const description = ev.description || "";
      out.push({
        uid: (ev.uid || summary) + "@" + when.getTime(),
        time: ev.allDay ? "all-day" : formatTime(when),
        title: summary,
        description,
        location: ev.location || "",
        type: inferType(summary, description),
      });
    }
    out.sort((a, b) => {
      // All-day events first, then by time string.
      if (a.time === "all-day" && b.time !== "all-day") return -1;
      if (b.time === "all-day" && a.time !== "all-day") return 1;
      return a.time.localeCompare(b.time);
    });

    return NextResponse.json({ events: out, configured: true });
  } catch (error) {
    console.error("GET /api/calendar failed:", error);
    return NextResponse.json({ error: "Failed to load calendar" }, { status: 500 });
  }
}
