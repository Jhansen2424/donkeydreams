"use client";

// A muted background loop that only downloads once it's near the screen and
// pauses while off it. With reduced motion, only the poster shows.

import { useEffect, useRef, useState } from "react";

export function LoopVideo({ src, poster, className = "" }: { src: string; poster: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [load, setLoad] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) {
      setLoad(true);
      return;
    }
    const near = new IntersectionObserver(([e]) => e.isIntersecting && setLoad(true), { rootMargin: "800px 0px" });
    const onScreen = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) el.play().catch(() => {});
      else el.pause();
    });
    near.observe(el);
    onScreen.observe(el);
    return () => {
      near.disconnect();
      onScreen.disconnect();
    };
  }, []);

  return (
    <video
      ref={ref}
      className={className}
      poster={poster}
      src={load ? src : undefined}
      muted
      loop
      playsInline
      autoPlay
      preload="none"
      aria-hidden
    />
  );
}
