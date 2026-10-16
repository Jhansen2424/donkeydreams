"use client";

// The four names, pinned under the header, lighting up whichever story is
// being read. A tap jumps to that story.

import { useEffect, useState } from "react";

export function StoryTabs({ stories }: { stories: { id: string; name: string }[] }) {
  const [active, setActive] = useState(stories[0]?.id);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-35% 0px -60% 0px" },
    );
    stories.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [stories]);

  return (
    <nav
      aria-label="Stories"
      className="sticky top-16 sm:top-20 z-30 bg-parchment/95 backdrop-blur border-b border-gold/25"
    >
      <div className="max-w-6xl mx-auto px-2 sm:px-8 flex justify-between sm:justify-center sm:gap-10 overflow-x-auto">
        {stories.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={`relative shrink-0 px-2.5 sm:px-1 py-3.5 text-[13px] sm:text-sm font-extrabold whitespace-nowrap transition-colors ${
              active === s.id ? "text-night" : "text-night/45 hover:text-night/80"
            }`}
          >
            {s.name}
            <span
              className={`absolute left-2 right-2 sm:left-0 sm:right-0 bottom-0 h-[3px] rounded-full bg-gold transition-opacity ${
                active === s.id ? "opacity-100" : "opacity-0"
              }`}
            />
          </a>
        ))}
      </div>
    </nav>
  );
}
