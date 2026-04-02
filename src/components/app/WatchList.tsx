import { AlertTriangle } from "lucide-react";
import { watchList, type WatchListEntry } from "@/lib/sanctuary-data";

const severityStyles = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-emerald-500",
};

export default function WatchList() {
  return (
    <div className="bg-white rounded-xl border border-card-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-red-500" />
        <h3 className="font-bold text-charcoal text-lg">Donkeys to Watch</h3>
      </div>

      <div className="space-y-3">
        {watchList.map((entry, i) => (
          <WatchItem key={i} entry={entry} />
        ))}
      </div>
    </div>
  );
}

function WatchItem({ entry }: { entry: WatchListEntry }) {
  return (
    <div className="flex gap-3 p-3 rounded-lg bg-cream/50 border border-card-border">
      <div className="flex flex-col items-center gap-1 pt-0.5">
        <div
          className={`w-2.5 h-2.5 rounded-full ${severityStyles[entry.severity]}`}
        />
        <p className="text-[10px] text-warm-gray/50 font-medium">
          {entry.date}
        </p>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-charcoal text-sm">{entry.animal}</p>
        <p className="text-sm text-warm-gray">{entry.issue}</p>
        <p className="text-xs text-warm-gray/70 mt-1">{entry.treatment}</p>
        {entry.assignedTo && (
          <p className="text-[11px] text-sky-dark font-medium mt-1">
            → {entry.assignedTo}
          </p>
        )}
      </div>
    </div>
  );
}
