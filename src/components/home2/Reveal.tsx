"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Fades content up as it scrolls into view. Anything already on screen at
 *  load (or with reduced motion) renders as-is, so nothing is ever stuck hidden. */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"static" | "waiting" | "in">("static");

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
    setPhase("waiting");
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setPhase("in");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${phase !== "static" ? "transition-[opacity,transform] duration-700 ease-out" : ""} ${
        phase === "waiting" ? "opacity-0 translate-y-6" : ""
      } ${className}`}
      style={phase === "in" ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
