"use client";

import { useEffect, useRef, useState } from "react";

// Floating particle type
interface Particle {
  id: number;
  type: "heart" | "hoofprint";
  left: number; // % from left
  delay: number; // animation delay in s
  duration: number; // animation duration in s
  size: number; // rem
  opacity: number;
}

// Generate random particles
function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    type: Math.random() > 0.4 ? "heart" : "hoofprint",
    left: Math.random() * 100,
    delay: Math.random() * 6,
    duration: 8 + Math.random() * 8,
    size: 1 + Math.random() * 2,
    opacity: 0.4 + Math.random() * 0.5,
  }));
}

const particles = generateParticles(40);

export default function HowToHelpHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style jsx global>{`
        @keyframes float-up {
          0% {
            transform: translateY(0) scale(1) rotate(0deg);
            opacity: var(--particle-opacity);
          }
          25% {
            transform: translateY(-25vh) scale(1.1) rotate(-5deg);
            opacity: var(--particle-opacity);
          }
          75% {
            opacity: calc(var(--particle-opacity) * 0.6);
          }
          100% {
            transform: translateY(-100vh) scale(0.8) rotate(5deg);
            opacity: 0;
          }
        }
        @keyframes heartbeat-bg {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.08;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.15);
            opacity: 0.25;
          }
        }
        @keyframes blur-in-hero {
          0% { filter: blur(16px); opacity: 0; transform: scale(0.95); }
          100% { filter: blur(0); opacity: 1; transform: scale(1); }
        }
        @keyframes fade-up-hero {
          0% { opacity: 0; transform: translateY(24px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes ticker-scroll-help {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      <section
        ref={sectionRef}
        className="relative min-h-[85vh] flex flex-col justify-center items-center overflow-hidden"
      >
        {/* Background herd photo */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://donkeydreams.org/wp-content/uploads/2022/09/Where-the-donkeys-are-free-cropped-dnsd.jpg')",
          }}
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-charcoal/75" />

        {/* Pulsing heart silhouette in background */}
        <div
          className="absolute left-1/2 top-1/2 w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] pointer-events-none"
          style={{ animation: "heartbeat-bg 2.5s ease-in-out infinite" }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-full h-full text-white/20"
          >
            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
          </svg>
        </div>

        {/* Floating hearts & hoofprints */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute bottom-0"
              style={{
                left: `${p.left}%`,
                fontSize: `${p.size}rem`,
                "--particle-opacity": p.opacity,
                animation: `float-up ${p.duration}s ease-in ${p.delay}s infinite`,
                opacity: 0,
              } as React.CSSProperties}
            >
              {p.type === "heart" ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="text-terra"
                  style={{ width: "1em", height: "1em" }}
                >
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
              ) : (
                <span style={{ fontSize: "1em", lineHeight: 1 }}>🫏</span>
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8">
          <p
            className="text-sand-light font-medium tracking-widest uppercase text-sm mb-5"
            style={
              isVisible
                ? { animation: "fade-up-hero 0.8s ease-out 0.2s forwards", opacity: 0 }
                : { opacity: 0 }
            }
          >
            Donkey Dreams Sanctuary
          </p>

          <h1
            className="text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-tight mb-6"
            style={
              isVisible
                ? { animation: "blur-in-hero 1.2s ease-out forwards" }
                : { opacity: 0, filter: "blur(16px)" }
            }
          >
            How To{" "}
            <span className="text-terra">Help</span>
          </h1>

          <p
            className="text-white/60 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-8"
            style={
              isVisible
                ? { animation: "fade-up-hero 0.8s ease-out 0.5s forwards", opacity: 0 }
                : { opacity: 0 }
            }
          >
            Every dollar feeds a donkey. Every visit changes a life.
            Every share spreads the dream a little further.
          </p>

          {/* Scroll down hint */}
          <div
            className="mt-4"
            style={
              isVisible
                ? { animation: "fade-up-hero 0.8s ease-out 0.9s forwards", opacity: 0 }
                : { opacity: 0 }
            }
          >
            <div className="inline-flex flex-col items-center gap-2 text-white/40">
              <span className="text-xs tracking-wider uppercase">Scroll to explore</span>
              <svg className="w-5 h-5 animate-bounce" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
              </svg>
            </div>
          </div>
        </div>

        {/* Impact ticker along the bottom */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-charcoal/40 backdrop-blur-sm py-3">
          <div className="overflow-hidden whitespace-nowrap">
            <div
              className="inline-flex items-center gap-6"
              style={{ animation: "ticker-scroll-help 30s linear infinite" }}
            >
              {[...Array(2)].map((_, rep) => (
                <div key={rep} className="inline-flex items-center gap-6">
                  {[
                    "50+ donkeys fed daily",
                    "100% goes to donkey care",
                    "501(c)(3) nonprofit",
                    "Scenic, Arizona",
                    "Visitors welcome",
                    "Monthly sponsorships available",
                    "Every donkey has a story",
                    "You can make a difference",
                  ].map((phrase, i) => (
                    <span key={i} className="inline-flex items-center gap-3">
                      <span className="text-white/70 text-sm font-medium tracking-wide">
                        {phrase}
                      </span>
                      <span className="text-terra/60 text-xs">&#9829;</span>
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
