import type { Metadata } from "next";
import { Settings } from "lucide-react";

export const metadata: Metadata = {
  title: "Settings — Donkey Dreams",
};

// Placeholder page. The Settings link exists in both the sidebar and mobile
// nav; without a route it 404s (and triggers an _rsc prefetch 404 in the
// console). This gives nav a real destination until the feature is built.
export default function SettingsPage() {
  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-7 h-7 text-sidebar" />
        <h1 className="text-2xl font-bold text-charcoal">Settings</h1>
      </div>

      <div className="rounded-xl border border-card-border bg-white p-8 text-center">
        <Settings className="w-10 h-10 text-warm-gray/50 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-charcoal mb-2">
          Coming soon
        </h2>
        <p className="text-sm text-warm-gray max-w-md mx-auto">
          Account preferences, team access, and sanctuary configuration will
          live here. Sign out is available at the bottom of the sidebar.
        </p>
      </div>
    </div>
  );
}
