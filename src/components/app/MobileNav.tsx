"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Heart,
  ClipboardCheck,
  Stethoscope,
  Menu,
} from "lucide-react";
import { useState } from "react";

const tabs = [
  { name: "Home", href: "/app", icon: LayoutDashboard },
  { name: "Animals", href: "/app/animals", icon: Heart },
  { name: "Tasks", href: "/app/tasks", icon: ClipboardCheck },
  { name: "Medical", href: "/app/medical", icon: Stethoscope },
  { name: "More", href: "#more", icon: Menu },
];

const moreLinks = [
  { name: "Watch List", href: "/app/watch" },
  { name: "Feed Buckets", href: "/app/feed" },
  { name: "Hoof & Dental", href: "/app/hoof-dental" },
  { name: "Weight Tracking", href: "/app/weight" },

  { name: "Admin", href: "/app/admin" },
  { name: "Donations", href: "/app/donations" },
  { name: "Events", href: "/app/events" },
  { name: "Impact Report", href: "/app/reports" },
  { name: "Settings", href: "/app/settings" },
];

export default function MobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      {/* More menu overlay */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute bottom-16 left-0 right-0 bg-white rounded-t-2xl border-t border-card-border p-4 space-y-1">
            {moreLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMoreOpen(false)}
                className="block px-4 py-3 rounded-lg text-sm font-medium text-charcoal hover:bg-cream transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-card-border">
        <div className="flex items-center justify-around h-16">
          {tabs.map((tab) => {
            const isMore = tab.href === "#more";
            const isActive = isMore
              ? moreOpen
              : tab.href === "/app"
                ? pathname === "/app"
                : pathname.startsWith(tab.href);
            const Icon = tab.icon;

            if (isMore) {
              return (
                <button
                  key={tab.name}
                  onClick={() => setMoreOpen(!moreOpen)}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-medium transition-colors ${
                    isActive ? "text-sidebar" : "text-warm-gray"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.name}
                </button>
              );
            }

            return (
              <Link
                key={tab.name}
                href={tab.href}
                onClick={() => setMoreOpen(false)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-medium transition-colors ${
                  isActive ? "text-sidebar" : "text-warm-gray"
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.name}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
