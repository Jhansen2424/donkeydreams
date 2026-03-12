"use client";

const names = [
  "Dusty",
  "Pepper",
  "Biscuit",
  "Clover",
  "Shadow",
  "Rosie",
  "Pink",
  "Eli",
  "Maple",
  "Thunder",
  "Daisy",
  "Banjo",
  "Sage",
  "Dolly",
  "Juniper",
  "Otis",
];

export default function DonkeyNameTicker() {
  // Duplicate the list for seamless loop
  const allNames = [...names, ...names];

  return (
    <div className="overflow-hidden whitespace-nowrap">
      <div
        className="inline-flex items-center gap-3"
        style={{ animation: "scroll-ticker 25s linear infinite" }}
      >
        {allNames.map((name, i) => (
          <span key={i} className="inline-flex items-center gap-3">
            <span className="text-white/90 text-sm sm:text-base font-medium tracking-wide">
              {name}
            </span>
            <span className="text-sand-light/40 text-xs">&#9679;</span>
          </span>
        ))}
      </div>
    </div>
  );
}
