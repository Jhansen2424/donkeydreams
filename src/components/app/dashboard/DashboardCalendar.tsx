"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Settings, Link as LinkIcon, X, Check } from "lucide-react";

interface CalendarEvent {
  time: string;
  title: string;
  type: "vet" | "farrier" | "event" | "task";
  description?: string;
  location?: string;
  animal?: string;
}

const eventStyles: Record<string, { bg: string; border: string; dot: string }> = {
  vet: { bg: "bg-sky/5", border: "border-sky/20", dot: "bg-sky" },
  farrier: { bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500" },
  event: { bg: "bg-purple-50", border: "border-purple-200", dot: "bg-purple-500" },
  task: { bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500" },
};

// Empty fallback. Populated from the iCal feed once a URL is configured.
// Exported so other dashboard code (metric tabs) can read the count.
export const todayEvents: CalendarEvent[] = [];

const STORAGE_KEY = "dashboard:ics-url";

export default function DashboardCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [icsUrl, setIcsUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved URL from localStorage on mount.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || "";
      setIcsUrl(saved);
    } catch {
      // localStorage unavailable (SSR, privacy mode) — ignore.
    }
  }, []);

  // Fetch events whenever the URL changes.
  useEffect(() => {
    async function load() {
      setError(null);
      if (!icsUrl) {
        setEvents([]);
        // Keep the exported array in sync for MetricTabs consumers.
        todayEvents.length = 0;
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/calendar?url=${encodeURIComponent(icsUrl)}`, {
          cache: "no-store",
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Failed to load calendar");
        const list: CalendarEvent[] = body.events || [];
        setEvents(list);
        todayEvents.length = 0;
        todayEvents.push(...list);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load calendar");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [icsUrl]);

  function saveUrl(next: string) {
    setIcsUrl(next.trim());
    try {
      if (next.trim()) localStorage.setItem(STORAGE_KEY, next.trim());
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setSettingsOpen(false);
  }

  return (
    <div className="bg-white rounded-xl border border-card-border flex flex-col h-full min-h-0">
      <div className="px-5 py-4 border-b border-card-border shrink-0 flex items-center gap-2">
        <CalendarDays className="w-5 h-5 text-sky" />
        <h3 className="font-bold text-charcoal text-lg">Today&apos;s Schedule</h3>
        <span className="ml-auto bg-sky/10 text-sky text-[10px] font-bold px-2 py-0.5 rounded-full">
          {events.length}
        </span>
        <button
          onClick={() => setSettingsOpen(true)}
          className="p-1.5 rounded-md text-warm-gray hover:text-charcoal hover:bg-cream transition-colors"
          title="Calendar settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {loading && (
          <p className="text-xs text-warm-gray/60 text-center py-6">
            Loading calendar...
          </p>
        )}
        {error && !loading && (
          <p className="text-xs text-red-600 text-center py-6">{error}</p>
        )}
        {!loading && !error && events.length === 0 && (
          <div className="text-center py-8 space-y-2">
            <p className="text-xs text-warm-gray/60">
              {icsUrl
                ? "No events scheduled today."
                : "Connect an iCal feed to show today's events."}
            </p>
            {!icsUrl && (
              <button
                onClick={() => setSettingsOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-sidebar hover:text-sidebar-light"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                Connect iCal
              </button>
            )}
          </div>
        )}
        {events.map((event, i) => {
          const style = eventStyles[event.type];
          return (
            <div
              key={i}
              className={`flex items-start gap-3 p-2.5 rounded-lg border ${style.bg} ${style.border}`}
            >
              <div className="flex items-center gap-2 shrink-0 w-20">
                <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
                <span className="text-[11px] font-semibold text-warm-gray">
                  {event.time}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-charcoal leading-snug">{event.title}</p>
                {event.location && (
                  <p className="text-[10px] text-warm-gray mt-0.5">{event.location}</p>
                )}
                {event.animal && (
                  <p className="text-[10px] text-sky-dark font-medium mt-0.5">
                    {event.animal}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {settingsOpen && (
        <IcalSettingsDialog
          current={icsUrl}
          onSave={saveUrl}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}

function IcalSettingsDialog({
  current,
  onSave,
  onClose,
}: {
  current: string;
  onSave: (url: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(current);

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-sidebar px-5 py-4 flex items-center justify-between">
          <h3 className="font-bold text-white">Connect iCal feed</h3>
          <button onClick={onClose} className="text-cream/60 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-sm text-warm-gray">
            Paste the secret iCal URL from Google Calendar (Settings → your
            calendar → Secret address in iCal format), Apple Calendar, or any
            other .ics feed. Today&apos;s events will show in the schedule.
          </p>
          <input
            type="url"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
            className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal placeholder:text-warm-gray/50 focus:outline-none focus:ring-2 focus:ring-sand/50"
            autoFocus
          />
          <p className="text-[11px] text-warm-gray/70">
            Stored locally in your browser. Use the Clear button to stop
            syncing.
          </p>
        </div>
        <div className="px-5 py-4 border-t border-card-border flex items-center justify-between gap-2">
          <button
            onClick={() => onSave("")}
            className="text-sm text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            Clear
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-charcoal bg-white border border-card-border rounded-lg hover:bg-cream transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(draft)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-sidebar rounded-lg hover:bg-sidebar-light transition-colors"
            >
              <Check className="w-4 h-4" />
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
