"use client";

import { useEffect, useRef, useState } from "react";

export default function AnimatedCTA() {
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
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style jsx global>{`
        @keyframes heartbeat-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(200, 120, 100, 0.4); }
          50% { transform: scale(1.05); box-shadow: 0 0 20px 8px rgba(200, 120, 100, 0.15); }
        }
        @keyframes blur-in {
          0% { filter: blur(12px); opacity: 0; }
          100% { filter: blur(0); opacity: 1; }
        }
        @keyframes fade-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes glow-border {
          0%, 100% { border-color: rgba(255,255,255,0.2); }
          50% { border-color: rgba(255,255,255,0.45); }
        }
      `}</style>

      <section ref={sectionRef} className="relative py-24 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://donkeydreams.org/wp-content/uploads/2022/09/Where-the-donkeys-are-free-cropped-dnsd.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-charcoal/80" />

        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          {/* Heading — blur-to-sharp reveal */}
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6"
            style={
              isVisible
                ? { animation: "blur-in 1s ease-out forwards" }
                : { opacity: 0, filter: "blur(12px)" }
            }
          >
            Their Story Is Still Being Written.{" "}
            <span className="text-sand-light">You Can Help.</span>
          </h2>

          {/* Subtitle — fade up with delay */}
          <p
            className="text-white/70 text-lg mb-10 max-w-xl mx-auto"
            style={
              isVisible
                ? { animation: "fade-up 0.8s ease-out 0.4s forwards", opacity: 0 }
                : { opacity: 0 }
            }
          >
            Every donation feeds a donkey. Every visit changes a life. Every
            share spreads the dream a little further.
          </p>

          {/* Buttons — staggered fade up + pulse on donate */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/#donate"
              className="bg-terra hover:bg-terra-dark text-white px-10 py-4 rounded-full text-lg font-semibold transition-colors shadow-xl"
              style={
                isVisible
                  ? {
                      animation:
                        "fade-up 0.8s ease-out 0.7s forwards, heartbeat-pulse 2.5s ease-in-out 2s infinite",
                      opacity: 0,
                    }
                  : { opacity: 0 }
              }
            >
              Donate Now
            </a>
            <a
              href="/#visit"
              className="backdrop-blur-sm text-white px-10 py-4 rounded-full text-lg font-semibold transition-all border border-white/20 hover:bg-white/20"
              style={
                isVisible
                  ? {
                      animation:
                        "fade-up 0.8s ease-out 0.9s forwards, glow-border 3s ease-in-out 2.5s infinite",
                      opacity: 0,
                      backgroundColor: "rgba(255,255,255,0.1)",
                    }
                  : { opacity: 0 }
              }
            >
              Plan a Visit
            </a>
            <a
              href="#"
              className="backdrop-blur-sm text-white px-10 py-4 rounded-full text-lg font-semibold transition-all border border-white/20 hover:bg-white/20"
              style={
                isVisible
                  ? {
                      animation:
                        "fade-up 0.8s ease-out 1.1s forwards, glow-border 3s ease-in-out 3s infinite",
                      opacity: 0,
                      backgroundColor: "rgba(255,255,255,0.1)",
                    }
                  : { opacity: 0 }
              }
            >
              Meet the Donkeys
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
