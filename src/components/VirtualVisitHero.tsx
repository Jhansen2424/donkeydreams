"use client";

import { useState, useEffect } from "react";

export default function VirtualVisitHero() {
  const [doorsOpen, setDoorsOpen] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);

  useEffect(() => {
    // Barn doors swing open after a short delay
    const doorTimer = setTimeout(() => setDoorsOpen(true), 400);
    // Content fades/slides in after doors are mostly open
    const contentTimer = setTimeout(() => setContentVisible(true), 1200);
    return () => {
      clearTimeout(doorTimer);
      clearTimeout(contentTimer);
    };
  }, []);

  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-charcoal">
      {/* Background image with overlay */}
      <div
        className="absolute inset-0 bg-cover bg-no-repeat opacity-20"
        style={{
          backgroundImage: "url('/virtual visit hero.webp')",
          backgroundPosition: "center 30%",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-charcoal/60 via-charcoal/40 to-charcoal/70" />

      {/* ── Barn Door Overlay ── */}
      {/* Left door */}
      <div
        className="fixed inset-0 z-50 pointer-events-none"
        style={{ perspective: "1200px" }}
      >
        <div
          className="absolute top-0 left-0 w-1/2 h-full bg-charcoal origin-left"
          style={{
            transition: "transform 1s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: doorsOpen ? "rotateY(-95deg)" : "rotateY(0deg)",
            boxShadow: doorsOpen ? "none" : "4px 0 20px rgba(0,0,0,0.5)",
          }}
        >
          {/* Door plank lines */}
          <div className="absolute inset-0 flex">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex-1 border-r border-warm-gray/20" />
            ))}
          </div>
          {/* Door handle */}
          <div className="absolute right-6 top-1/2 -translate-y-1/2 w-3 h-16 bg-sand-dark/40 rounded-full" />
        </div>
      </div>
      {/* Right door */}
      <div
        className="fixed inset-0 z-50 pointer-events-none"
        style={{ perspective: "1200px" }}
      >
        <div
          className="absolute top-0 right-0 w-1/2 h-full bg-charcoal origin-right"
          style={{
            transition: "transform 1s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: doorsOpen ? "rotateY(95deg)" : "rotateY(0deg)",
            boxShadow: doorsOpen ? "none" : "-4px 0 20px rgba(0,0,0,0.5)",
          }}
        >
          <div className="absolute inset-0 flex">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex-1 border-r border-warm-gray/20" />
            ))}
          </div>
          <div className="absolute left-6 top-1/2 -translate-y-1/2 w-3 h-16 bg-sand-dark/40 rounded-full" />
        </div>
      </div>

      {/* ── Main Content (left-right split) ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-24">
        {/* Left side — Text with fade+slide + dust particles */}
        <div
          className="relative"
          style={{
            transition:
              "opacity 0.8s ease-out, transform 0.8s ease-out",
            opacity: contentVisible ? 1 : 0,
            transform: contentVisible
              ? "translateX(0)"
              : "translateX(-60px)",
          }}
        >
          {/* Dust particles */}
          {contentVisible && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(8)].map((_, i) => (
                <span
                  key={i}
                  className="absolute rounded-full bg-sand/40"
                  style={{
                    width: `${3 + Math.random() * 5}px`,
                    height: `${3 + Math.random() * 5}px`,
                    left: `${Math.random() * 100}%`,
                    top: `${40 + Math.random() * 50}%`,
                    animation: `dust-float ${2 + Math.random() * 2}s ease-out ${Math.random() * 1.5}s both`,
                  }}
                />
              ))}
            </div>
          )}

          <p className="text-sand-light font-medium tracking-widest uppercase text-sm mb-4">
            Get a Digital Dose of Donkey Love!
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            Virtual{" "}
            <span className="text-sand-light">Visits</span>
          </h1>
          <p className="text-white/70 text-lg sm:text-xl max-w-lg leading-relaxed mb-8">
            Feel the joy and love of Donkey Dreams Sanctuary right on your
            screen! Whether you&apos;re celebrating a special occasion or just need
            some warm and fuzzy burro energy, our Virtual Visits offer a private
            online LIVE experience of daily donkey life.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="#book"
              className="bg-terra hover:bg-terra-dark text-white px-8 py-4 rounded-full text-lg font-semibold transition-all hover:scale-105 shadow-lg text-center"
            >
              Book a Visit
            </a>
            <a
              href="#how-it-works"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-full text-lg font-semibold transition-all border border-white/20 text-center"
            >
              How It Works
            </a>
          </div>
        </div>

        {/* Right side — Video call frame */}
        <div
          className="relative"
          style={{
            transition:
              "opacity 0.8s ease-out 0.3s, transform 0.8s ease-out 0.3s",
            opacity: contentVisible ? 1 : 0,
            transform: contentVisible
              ? "translateX(0)"
              : "translateX(60px)",
          }}
        >
          {/* Video call window chrome */}
          <div className="bg-[#1e1e1e] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
            {/* Title bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#2a2a2a]">
              <div className="flex items-center gap-2">
                {/* Traffic light dots */}
                <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <span className="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>
              <span className="text-white/60 text-sm font-medium">
                Donkey Dreams — Live Visit
              </span>
              <div className="flex items-center gap-3 text-white/40">
                {/* Mic icon */}
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14a3 3 0 003-3V5a3 3 0 00-6 0v6a3 3 0 003 3zm5-3a5 5 0 01-10 0H5a7 7 0 0014 0h-2zm-5 9a1 1 0 01-1-1v-2h2v2a1 1 0 01-1 1z" />
                </svg>
                {/* Camera icon */}
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M15 8v8H5V8h10m1-2H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4V7a1 1 0 00-1-1z" />
                </svg>
              </div>
            </div>

            {/* "Video feed" — the donkey image */}
            <div className="relative">
              <img
                src="/virtual visit hero.webp"
                alt="Donkeys at Donkey Dreams Sanctuary during a virtual visit"
                className="w-full h-auto object-cover"
                style={{ maxHeight: "400px", objectPosition: "center 30%" }}
              />

              {/* Live badge */}
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
                LIVE
              </div>

              {/* Participant count */}
              <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                </svg>
                You + 12 donkeys
              </div>

              {/* Duration timer */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white text-sm font-mono px-4 py-1.5 rounded-full">
                🕐 30:00
              </div>
            </div>

            {/* Bottom toolbar */}
            <div className="flex items-center justify-center gap-4 py-3 bg-[#2a2a2a]">
              <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center text-white/60">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14a3 3 0 003-3V5a3 3 0 00-6 0v6a3 3 0 003 3z" />
                </svg>
              </button>
              <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center text-white/60">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M15 8v8H5V8h10m1-2H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4V7a1 1 0 00-1-1z" />
                </svg>
              </button>
              <button className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 transition flex items-center justify-center text-white shadow-lg">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.24 1.01l-2.2 2.2z" />
                </svg>
              </button>
              <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center text-white/60">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z" />
                </svg>
              </button>
              <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center text-white/60">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M15 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V9l-6-6zM5 19V5h9v5h5v9H5z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <svg
          className="w-6 h-6 text-white/60"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </div>
    </section>
  );
}
