"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { animals, herds, herdCounts, type HerdName } from "@/lib/animals";

type Mode = "closed" | "mega" | "palette";

// Group donkeys by herd, alphabetized within each herd.
function useGroupedDonkeys() {
  return useMemo(() => {
    const grouped = new Map<HerdName, typeof animals>();
    for (const h of herds) grouped.set(h, []);
    for (const a of animals) {
      const list = grouped.get(a.herd as HerdName);
      if (list) list.push(a);
    }
    for (const list of grouped.values()) {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return grouped;
  }, []);
}

export default function MeetDonkeysMenu({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const [mode, setMode] = useState<Mode>("closed");
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const paletteInputRef = useRef<HTMLInputElement>(null);
  const grouped = useGroupedDonkeys();

  // Close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setMode("closed");
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // ⌘K / Ctrl+K to open palette globally; Esc to close
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setMode("palette");
      } else if (e.key === "Escape") {
        setMode("closed");
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Focus the palette input when it opens
  useEffect(() => {
    if (mode === "palette") {
      setQuery("");
      setActiveIdx(0);
      // next tick so the input is mounted
      requestAnimationFrame(() => paletteInputRef.current?.focus());
    }
  }, [mode]);

  // Lock body scroll while palette is open
  useEffect(() => {
    if (mode === "palette") {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mode]);

  // Search results — flat list of donkeys (and matching herds at top)
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [] as { type: "herd" | "donkey"; name: string; herd: string; slug?: string }[];
    const out: { type: "herd" | "donkey"; name: string; herd: string; slug?: string }[] = [];
    for (const h of herds) {
      if (h.toLowerCase().includes(q)) {
        out.push({ type: "herd", name: h, herd: h });
      }
    }
    for (const a of animals) {
      if (a.name.toLowerCase().includes(q)) {
        out.push({ type: "donkey", name: a.name, herd: a.herd, slug: a.slug });
      }
    }
    return out.slice(0, 50);
  }, [query]);

  // The public /donkeys page is a flat curated grid (no herd sections yet),
  // so herd clicks land on the top of the page. Donkey clicks use a hash —
  // DonkeyProfileGrid reads the hash on mount and pops the matching profile.
  function herdHref(_h: string) {
    return `/donkeys`;
  }
  function donkeyHref(slug: string) {
    return `/donkeys#${slug}`;
  }

  function close() {
    setMode("closed");
    onNavigate?.();
  }

  // Palette keyboard nav
  function onPaletteKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = results[activeIdx];
      if (!r) return;
      window.location.href = r.type === "herd" ? herdHref(r.herd) : donkeyHref(r.slug!);
      close();
    }
  }

  return (
    <div className="relative" ref={wrapRef}>
      {/* Trigger button (matches the rest of the navbar) */}
      <button
        onClick={() => setMode(mode === "mega" ? "closed" : "mega")}
        onMouseEnter={() => mode === "closed" && setMode("mega")}
        className="text-charcoal hover:text-sky transition-colors text-sm font-semibold flex items-center gap-1 cursor-pointer"
      >
        Meet the Donkeys
        <svg
          className={`w-3.5 h-3.5 transition-transform ${mode === "mega" ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Mega menu */}
      {mode === "mega" && (
        <div
          className="fixed left-1/2 -translate-x-1/2 top-20 mt-2 w-[min(96vw,1100px)] bg-white rounded-3xl shadow-2xl border border-sky/10 p-6 z-50"
          onMouseLeave={() => setMode("closed")}
        >
          {/* Header row: search button + count */}
          <div className="flex items-center justify-between mb-5 pb-5 border-b border-sky/10">
            <div>
              <p className="text-xs uppercase tracking-widest text-sky font-semibold">
                The Herd
              </p>
              <h3 className="text-2xl font-bold text-charcoal">
                {animals.length} rescued donkeys · {herds.length} herds
              </h3>
            </div>
            <button
              onClick={() => setMode("palette")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-sky/10 hover:bg-sky/20 text-sky font-semibold text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
              </svg>
              Search all donkeys
              <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 rounded bg-white/80 text-[10px] text-charcoal/60 border border-sky/10">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Herd grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5 max-h-[60vh] overflow-y-auto pr-2">
            {herds.map((h) => {
              const list = grouped.get(h) ?? [];
              return (
                <div key={h}>
                  <a
                    href={herdHref(h)}
                    onClick={close}
                    className="flex items-baseline justify-between mb-2 group"
                  >
                    <span className="text-sm font-bold text-charcoal group-hover:text-sky transition-colors">
                      {h}
                    </span>
                    <span className="text-[11px] text-charcoal/50 font-medium">
                      {herdCounts[h]}
                    </span>
                  </a>
                  <ul className="space-y-1">
                    {list.map((d) => (
                      <li key={d.slug}>
                        <a
                          href={donkeyHref(d.slug)}
                          onClick={close}
                          className="block text-xs text-charcoal/70 hover:text-sky hover:bg-sky/5 rounded px-2 py-1 transition-colors"
                        >
                          {d.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Footer link */}
          <div className="mt-5 pt-5 border-t border-sky/10 flex justify-center">
            <a
              href="/donkeys"
              onClick={close}
              className="text-sm font-semibold text-sky hover:text-sky-dark transition-colors"
            >
              View the full herd page →
            </a>
          </div>
        </div>
      )}

      {/* Command palette */}
      {mode === "palette" && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm"
            onClick={() => setMode("closed")}
          />
          {/* Panel */}
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-sky/10">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-sky/10">
              <svg className="w-5 h-5 text-sky" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
              </svg>
              <input
                ref={paletteInputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIdx(0);
                }}
                onKeyDown={onPaletteKey}
                placeholder="Search donkeys or herds…"
                className="flex-1 outline-none text-charcoal placeholder:text-charcoal/40 text-base"
              />
              <kbd className="hidden sm:inline-block px-2 py-1 rounded bg-sky/10 text-[11px] text-charcoal/60 font-mono">
                esc
              </kbd>
            </div>

            <div className="max-h-[55vh] overflow-y-auto">
              {!query && (
                <div className="p-6">
                  <p className="text-xs uppercase tracking-widest text-charcoal/40 font-semibold mb-3">
                    Browse herds
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {herds.map((h) => (
                      <a
                        key={h}
                        href={herdHref(h)}
                        onClick={close}
                        className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-sky/5 transition-colors"
                      >
                        <span className="text-sm font-semibold text-charcoal">{h}</span>
                        <span className="text-xs text-charcoal/40">{herdCounts[h]}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {query && results.length === 0 && (
                <div className="p-8 text-center text-charcoal/50 text-sm">
                  No donkeys or herds match &ldquo;{query}&rdquo;
                </div>
              )}

              {query && results.length > 0 && (
                <ul className="py-2">
                  {results.map((r, i) => (
                    <li key={`${r.type}-${r.name}`}>
                      <a
                        href={r.type === "herd" ? herdHref(r.herd) : donkeyHref(r.slug!)}
                        onClick={close}
                        onMouseEnter={() => setActiveIdx(i)}
                        className={`flex items-center justify-between px-5 py-3 transition-colors ${
                          i === activeIdx ? "bg-sky/10" : "hover:bg-sky/5"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-bold ${
                              r.type === "herd"
                                ? "bg-sky/15 text-sky"
                                : "bg-sand/40 text-charcoal/70"
                            }`}
                          >
                            {r.type === "herd" ? "H" : r.name[0]}
                          </span>
                          <span className="text-sm font-semibold text-charcoal">
                            {r.name}
                          </span>
                        </div>
                        <span className="text-xs text-charcoal/40">
                          {r.type === "herd" ? "Herd" : r.herd}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-t border-sky/10 bg-cream/40 text-[11px] text-charcoal/50">
              <span>↑↓ navigate · ↵ open · esc close</span>
              <span>{animals.length} donkeys · {herds.length} herds</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
