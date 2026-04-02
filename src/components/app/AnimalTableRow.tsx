import { Pencil } from "lucide-react";

interface AnimalTableRowProps {
  name: string;
  age: string;
  sex: string;
  origin: string;
  status: string;
  tags: { label: string; color: "green" | "blue" | "amber" | "red" }[];
  herd: string;
  pen: string;
  profileImage?: string;
  onEdit: () => void;
}

const tagColors = {
  green: "bg-emerald-100 text-emerald-700",
  blue: "bg-sky/10 text-sky-dark",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
};

export default function AnimalTableRow({
  name,
  age,
  sex,
  origin,
  status,
  tags,
  herd,
  pen,
  profileImage,
  onEdit,
}: AnimalTableRowProps) {
  return (
    <tr className="border-b border-card-border hover:bg-cream/50 transition-colors cursor-pointer" onClick={() => onEdit()}>
      {/* Photo + Name */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-cream overflow-hidden shrink-0">
            {profileImage ? (
              <img
                src={profileImage}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm">
                🫏
              </div>
            )}
          </div>
          <span className="font-semibold text-charcoal">{name}</span>
        </div>
      </td>
      <td className="py-3 px-4 text-sm text-warm-gray">{age}</td>
      <td className="py-3 px-4 text-sm text-warm-gray">{sex}</td>
      <td className="py-3 px-4 text-sm text-warm-gray">{origin}</td>
      <td className="py-3 px-4 text-sm text-warm-gray">{herd}</td>
      <td className="py-3 px-4 text-sm text-warm-gray">{pen || "—"}</td>
      <td className="py-3 px-4">
        <span
          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
            status === "Active"
              ? "bg-emerald-100 text-emerald-700"
              : status === "Special Needs"
                ? "bg-red-100 text-red-700"
                : "bg-amber-100 text-amber-700"
          }`}
        >
          {status}
        </span>
      </td>
      {/* Tags */}
      <td className="py-3 px-4">
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span
              key={tag.label}
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tagColors[tag.color]}`}
            >
              {tag.label}
            </span>
          ))}
        </div>
      </td>
      {/* Edit */}
      <td className="py-3 px-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-1.5 rounded-lg hover:bg-cream text-warm-gray hover:text-charcoal transition-colors"
          title={`Edit ${name}`}
        >
          <Pencil className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}
