import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";

export const metadata: Metadata = {
  title: "Impact Report — Donkey Dreams",
};

// Placeholder page. The Impact Report link exists in both the sidebar and
// mobile nav; without a route it 404s (and triggers an _rsc prefetch 404 in
// the console). This gives nav a real destination until the feature is built.
export default function ReportsPage() {
  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-7 h-7 text-sidebar" />
        <h1 className="text-2xl font-bold text-charcoal">Impact Report</h1>
      </div>

      <div className="rounded-xl border border-card-border bg-white p-8 text-center">
        <BarChart3 className="w-10 h-10 text-warm-gray/50 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-charcoal mb-2">
          Coming soon
        </h2>
        <p className="text-sm text-warm-gray max-w-md mx-auto">
          Donations, animals cared for, volunteer hours, and other sanctuary
          impact metrics will be summarized here for sharing with supporters.
        </p>
      </div>
    </div>
  );
}
