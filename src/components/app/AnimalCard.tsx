import { Heart } from "lucide-react";

interface AnimalCardProps {
  name: string;
  age: string;
  sex: string;
  origin: string;
  tags: { label: string; color: "green" | "blue" | "amber" | "red" }[];
  tasks: string[];
  taskProgress: string;
  emoji?: string;
  heartColor?: string;
}

const tagColors = {
  green: "bg-emerald-100 text-emerald-700",
  blue: "bg-sky/10 text-sky-dark",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
};

export default function AnimalCard({
  name,
  age,
  sex,
  origin,
  tags,
  tasks,
  taskProgress,
  emoji = "🫏",
  heartColor = "text-terra",
}: AnimalCardProps) {
  return (
    <div className="bg-white rounded-xl border border-card-border p-5 hover:shadow-md transition-shadow cursor-pointer">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center text-lg shrink-0">
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Heart className={`w-4 h-4 ${heartColor} fill-current`} />
            <h3 className="font-bold text-charcoal text-lg">{name}</h3>
          </div>
          <p className="text-sm text-warm-gray">
            {age} · {sex} · {origin}
          </p>
        </div>
      </div>

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

      {/* Tasks */}
      <ul className="space-y-1.5 mb-3">
        {tasks.map((task) => (
          <li
            key={task}
            className="text-sm text-warm-gray flex items-start gap-2"
          >
            <span className="text-sand-dark mt-0.5">•</span>
            <span className="line-clamp-1">{task}</span>
          </li>
        ))}
      </ul>

      {/* Progress */}
      <p className="text-xs text-warm-gray/60 font-medium">{taskProgress}</p>
    </div>
  );
}
