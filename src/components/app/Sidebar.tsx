"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Heart,
  Stethoscope,
  ClipboardCheck,
  Footprints,
  Weight,
  Users,
  DollarSign,
  CalendarDays,
  BarChart3,
  Settings,
  UtensilsCrossed,
  AlertTriangle,
} from "lucide-react";

const navGroups = [
  {
    label: "Main",
    items: [
      { name: "Dashboard", href: "/app", icon: LayoutDashboard },
      { name: "Animals", href: "/app/animals", icon: Heart, badge: 99 },
      { name: "Watch List", href: "/app/watch", icon: AlertTriangle, badge: 6 },
    ],
  },
  {
    label: "Care",
    items: [
      { name: "Medical Entries", href: "/app/medical", icon: Stethoscope },
      { name: "Daily Schedule", href: "/app/tasks", icon: ClipboardCheck, badge: 34 },
      { name: "Feed Buckets", href: "/app/feed", icon: UtensilsCrossed },
      { name: "Hoof Care", href: "/app/hoof-dental?tab=hoof", icon: Footprints },
      { name: "Dental Care", href: "/app/hoof-dental?tab=dental", icon: Footprints },
      { name: "Weight Tracking", href: "/app/weight", icon: Weight },
    ],
  },
  {
    label: "Operations",
    items: [

      { name: "Admin", href: "/app/admin", icon: Users },
      { name: "Donations", href: "/app/donations", icon: DollarSign },
      { name: "Events", href: "/app/events", icon: CalendarDays },
    ],
  },
  {
    label: "Reports",
    items: [
      { name: "Impact Report", href: "/app/reports", icon: BarChart3 },
      { name: "Settings", href: "/app/settings", icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-sidebar text-cream min-h-screen fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <Link href="/app" className="block">
          <h1 className="text-xl font-bold text-white leading-tight">
            Donkey <span className="text-sand">Dreams</span>
          </h1>
          <p className="text-[11px] uppercase tracking-[0.2em] text-cream/50 mt-0.5">
            Sanctuary Manager
          </p>
        </Link>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-cream/40 mb-2">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const hrefPath = item.href.split("?")[0];
                const isActive =
                  item.href === "/app"
                    ? pathname === "/app"
                    : pathname.startsWith(hrefPath);
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-sidebar-dark text-white"
                          : "text-cream/70 hover:bg-sidebar-light hover:text-white"
                      }`}
                    >
                      <Icon className="w-[18px] h-[18px] shrink-0" />
                      <span className="flex-1">{item.name}</span>
                      {item.badge && (
                        <span className="bg-sand text-sidebar text-[11px] font-bold px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
