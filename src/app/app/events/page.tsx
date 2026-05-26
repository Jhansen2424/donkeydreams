import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";

export const metadata: Metadata = {
  title: "Events / Visitors / Schedule — Donkey Dreams",
};

// Placeholder page. The Events / Visitors / Schedule link exists in both the
// sidebar and mobile nav; without a route it 404s (and triggers an _rsc
// prefetch 404 in the console). This gives nav a real destination until the
// feature is built out.
export default function EventsPage() {
  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <CalendarDays className="w-7 h-7 text-sidebar" />
        <h1 className="text-2xl font-bold text-charcoal">
          Events / Visitors / Schedule
        </h1>
      </div>

      <div className="rounded-xl border border-card-border bg-white p-8 text-center">
        <CalendarDays className="w-10 h-10 text-warm-gray/50 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-charcoal mb-2">
          Coming soon
        </h2>
        <p className="text-sm text-warm-gray max-w-md mx-auto">
          Visitor bookings, sanctuary events, and the shared schedule will live
          here. Today&apos;s calendar items already surface on the dashboard.
        </p>
      </div>
    </div>
  );
}
