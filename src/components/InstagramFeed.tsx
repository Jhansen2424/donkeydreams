"use client";

import { useEffect, useState, useCallback } from "react";

type IGMedia = {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url: string;
  permalink: string;
  thumbnail_url?: string;
  timestamp: string;
};

export default function InstagramFeed() {
  const [media, setMedia] = useState<IGMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/instagram")
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (j.error) {
          setError(j.error);
        } else {
          setMedia((j.data ?? []).slice(0, 16));
        }
      })
      .catch((e) => !cancelled && setError(String(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const close = useCallback(() => setActiveIndex(null), []);
  const prev = useCallback(
    () =>
      setActiveIndex((i) =>
        i === null ? null : (i - 1 + media.length) % media.length
      ),
    [media.length]
  );
  const next = useCallback(
    () => setActiveIndex((i) => (i === null ? null : (i + 1) % media.length)),
    [media.length]
  );

  useEffect(() => {
    if (activeIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [activeIndex, close, prev, next]);

  const active = activeIndex !== null ? media[activeIndex] : null;

  return (
    <section className="relative py-24 bg-gradient-to-b from-sand-dark via-cream to-cream overflow-hidden">
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sky font-bold tracking-[0.15em] uppercase text-sm mb-4">
            @donkeydreams
          </p>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-charcoal mb-4">
            Follow Along on Instagram
          </h2>
          <p className="text-warm-gray text-xl">
            Daily moments from the sanctuary.
          </p>
        </div>

        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-white/40 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        )}

        {error && (
          <div className="text-center text-warm-gray">
            Unable to load Instagram feed right now.
          </div>
        )}

        {!loading && !error && media.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
            {media.map((m, i) => {
              const thumb =
                m.media_type === "VIDEO"
                  ? m.thumbnail_url ?? m.media_url
                  : m.media_url;
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveIndex(i)}
                  className="group relative aspect-square overflow-hidden rounded-2xl bg-white/40 shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgba(92,205,243,0.25)] transition-all duration-300"
                  aria-label="Open Instagram post"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumb}
                    alt={m.caption?.slice(0, 80) ?? "Instagram post"}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {m.media_type === "VIDEO" && (
                    <div className="absolute top-2 right-2 bg-black/60 rounded-full p-1.5">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="white"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              close();
            }}
            className="absolute top-4 right-4 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-11 h-11 flex items-center justify-center text-2xl"
            aria-label="Close"
          >
            ×
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-11 h-11 flex items-center justify-center text-2xl"
            aria-label="Previous"
          >
            ‹
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-11 h-11 flex items-center justify-center text-2xl"
            aria-label="Next"
          >
            ›
          </button>

          <div
            className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {active.media_type === "VIDEO" ? (
              <video
                src={active.media_url}
                poster={active.thumbnail_url}
                controls
                autoPlay
                playsInline
                className="max-h-[80vh] w-auto rounded-2xl shadow-2xl"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={active.media_url}
                alt={active.caption?.slice(0, 120) ?? "Instagram post"}
                className="max-h-[80vh] w-auto rounded-2xl shadow-2xl object-contain"
              />
            )}
            {active.caption && (
              <p className="mt-4 text-white/90 text-sm max-w-2xl text-center line-clamp-3">
                {active.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
