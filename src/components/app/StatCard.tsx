import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  highlight?: boolean;
}

export default function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  highlight,
}: StatCardProps) {
  return (
    <div
      className={`bg-white rounded-xl border p-5 ${
        highlight ? "border-sand" : "border-card-border"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-warm-gray">
          {label}
        </p>
        <Icon
          className={`w-5 h-5 ${highlight ? "text-sand-dark" : "text-warm-gray/40"}`}
        />
      </div>
      <p className="text-3xl sm:text-4xl font-extrabold text-charcoal leading-none">
        {value}
      </p>
      <p className="text-sm text-warm-gray mt-1.5">{subtitle}</p>
    </div>
  );
}
