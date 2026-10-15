"use client";

// One photo held in place while the story scrolls past it; the photo
// dissolves to the next as each step reaches the middle of the screen.
// Desktop only: on narrow screens each step shows its photo inline.

import { useEffect, useRef, useState, type ReactNode } from "react";

export type StoryPhoto = { src: string; alt: string; pos?: string };
export type StoryStep = { photo: number; content: ReactNode; inlinePhoto?: boolean };

export function StickyStory({ photos, steps }: { photos: StoryPhoto[]; steps: StoryStep[] }) {
  const [active, setActive] = useState(0);
  const stepEls = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.step));
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    stepEls.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const shown = steps[active]?.photo ?? 0;

  return (
    <div className="max-w-6xl mx-auto lg:grid lg:grid-cols-2 lg:gap-20">
      <div className="hidden lg:block">
        <div className="sticky top-28 h-[calc(100svh-9rem)] py-6">
          <div className="relative h-full rounded-[2.5rem] overflow-hidden shadow-2xl bg-blush">
            {photos.map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={p.src}
                src={p.src}
                alt={i === shown ? p.alt : ""}
                aria-hidden={i !== shown}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-out"
                style={{ opacity: i === shown ? 1 : 0, objectPosition: p.pos ?? "center" }}
              />
            ))}
            {/* which photo of how many, as soft dots */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
              {photos.map((p, i) => (
                <span
                  key={p.src}
                  className={`h-1.5 rounded-full transition-all duration-500 ${i === shown ? "w-8 bg-white" : "w-1.5 bg-white/55"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        {steps.map((s, i) => (
          <div
            key={i}
            ref={(el) => {
              stepEls.current[i] = el;
            }}
            data-step={i}
            className="lg:min-h-[80svh] flex flex-col justify-center py-10 lg:py-16"
          >
            {s.inlinePhoto !== false && (
              <div className="lg:hidden mb-8 rounded-[2rem] overflow-hidden shadow-xl aspect-[4/5] sm:aspect-[5/4]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photos[s.photo].src}
                  alt={photos[s.photo].alt}
                  loading="lazy"
                  className="w-full h-full object-cover"
                  style={{ objectPosition: photos[s.photo].pos ?? "center" }}
                />
              </div>
            )}
            {s.content}
          </div>
        ))}
      </div>
    </div>
  );
}
