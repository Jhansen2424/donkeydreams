interface TimelineEvent {
  date: string;
  name: string;
  description: string;
  urgent?: boolean;
}

interface MedicalTimelineProps {
  events: TimelineEvent[];
}

export default function MedicalTimeline({ events }: MedicalTimelineProps) {
  return (
    <div className="bg-white rounded-xl border border-card-border p-5">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-lg">⚠</span>
        <h3 className="font-bold text-charcoal text-lg">
          Upcoming Medical & Care
        </h3>
      </div>

      <div className="space-y-0">
        {events.map((event, i) => (
          <div key={i} className="flex gap-4 pb-5 last:pb-0">
            {/* Date column */}
            <div className="w-14 shrink-0 text-right">
              <p className="text-xs font-bold uppercase text-warm-gray/60 leading-tight">
                {event.date}
              </p>
            </div>

            {/* Dot and line */}
            <div className="flex flex-col items-center">
              <div
                className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${
                  event.urgent ? "bg-red-500" : "bg-sand-dark"
                }`}
              />
              {i < events.length - 1 && (
                <div className="w-px flex-1 bg-card-border mt-1" />
              )}
            </div>

            {/* Content */}
            <div className="pb-1">
              <p className="font-semibold text-charcoal text-sm">
                {event.name}
              </p>
              <p className="text-sm text-warm-gray">{event.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
