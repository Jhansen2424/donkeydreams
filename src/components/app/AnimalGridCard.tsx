import { Pencil, AlertTriangle } from "lucide-react";
import { feedSchedules } from "@/lib/sanctuary-data";
import { watchList } from "@/lib/sanctuary-data";

interface AnimalGridCardProps {
  name: string;
  age: string;
  sex: string;
  origin: string;
  status: string;
  pen: string;
  tags: { label: string; color: "green" | "blue" | "amber" | "red" }[];
  tasks: { title: string; interval: string; type: string }[];
  medicalRecords: {
    title: string;
    type: string;
    date: string;
    description: string;
    urgent: boolean;
  }[];
  profileImage?: string;
  onEdit: () => void;
}

const tagColors = {
  green: "bg-emerald-100 text-emerald-700",
  blue: "bg-sky/10 text-sky-dark",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
};

export default function AnimalGridCard({
  name,
  age,
  sex,
  origin,
  status,
  pen,
  tags,
  tasks,
  medicalRecords,
  profileImage,
  onEdit,
}: AnimalGridCardProps) {
  const feedPlan = feedSchedules.find(
    (f) => f.animal.toLowerCase() === name.toLowerCase()
  );
  const watchAlert = watchList.find(
    (w) => w.animal.toLowerCase() === name.toLowerCase()
  );
  const urgentMedical = medicalRecords.filter((r) => r.urgent);
  const dailyTasks = tasks.filter((t) => t.interval === "Daily");

  return (
    <div className="bg-white rounded-xl border border-card-border overflow-hidden hover:shadow-md transition-shadow group">
      {/* Photo */}
      <div className="aspect-[4/3] bg-cream overflow-hidden relative">
        {profileImage ? (
          <img
            src={profileImage}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl">🫏</span>
          </div>
        )}
        {/* Edit button overlay */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="absolute top-3 right-3 p-2 bg-white/90 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white text-warm-gray hover:text-charcoal"
          title={`Edit ${name}`}
        >
          <Pencil className="w-4 h-4" />
        </button>
        {/* Watch alert badge */}
        {watchAlert && (
          <div className="absolute top-3 left-3 p-1.5 bg-red-500 rounded-lg">
            <AlertTriangle className="w-3.5 h-3.5 text-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-bold text-charcoal text-lg">{name}</h3>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
              status === "Active"
                ? "bg-emerald-100 text-emerald-700"
                : status === "Special Needs"
                  ? "bg-red-100 text-red-700"
                  : "bg-amber-100 text-amber-700"
            }`}
          >
            {status}
          </span>
        </div>
        <p className="text-sm text-warm-gray mb-1">
          {age} · {sex} · {origin}
        </p>
        {pen && (
          <p className="text-xs text-warm-gray/60 mb-3">{pen}</p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tags.map((tag) => (
              <span
                key={tag.label}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${tagColors[tag.color]}`}
              >
                {tag.label}
              </span>
            ))}
          </div>
        )}

        {/* Watch alert */}
        {watchAlert && (
          <div className="p-2 bg-red-50 border border-red-200 rounded-lg mb-3">
            <p className="text-xs font-semibold text-red-700">
              ⚠ {watchAlert.issue}
            </p>
            <p className="text-[11px] text-red-600 mt-0.5">
              {watchAlert.treatment}
            </p>
          </div>
        )}

        {/* Urgent medical */}
        {!watchAlert && urgentMedical.length > 0 && (
          <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg mb-3">
            <p className="text-xs font-semibold text-amber-700">
              {urgentMedical[0].title} — {urgentMedical[0].date}
            </p>
          </div>
        )}

        {/* Feed summary */}
        {feedPlan && (
          <div className="mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-warm-gray/50 mb-1">
              Feed
            </p>
            <p className="text-xs text-warm-gray">
              {feedPlan.plan.am
                .map((f) => `${f.amount} ${f.item.toLowerCase()}`)
                .join(", ")}
              {feedPlan.notes ? ` · ${feedPlan.notes.split(".")[0]}` : ""}
            </p>
          </div>
        )}

        {/* Today's tasks */}
        {dailyTasks.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-warm-gray/50 mb-1">
              Today ({dailyTasks.length} tasks)
            </p>
            <ul className="space-y-1">
              {dailyTasks.slice(0, 3).map((task) => (
                <li
                  key={task.title}
                  className="text-xs text-warm-gray flex items-start gap-1.5"
                >
                  <span className="text-sand-dark mt-0.5">•</span>
                  <span className="line-clamp-1">{task.title}</span>
                </li>
              ))}
              {dailyTasks.length > 3 && (
                <li className="text-[11px] text-warm-gray/50">
                  +{dailyTasks.length - 3} more
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
