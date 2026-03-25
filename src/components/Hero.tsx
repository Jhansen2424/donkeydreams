"use client";

import { useState, useEffect } from "react";

const heroImages = ["/hero/2.webp", "/hero/1.webp"];
const ROTATE_HOURS = 3;

function getHeroImage() {
  const index =
    Math.floor(Date.now() / (ROTATE_HOURS * 60 * 60 * 1000)) %
    heroImages.length;
  return heroImages[index];
}

export default function Hero() {
  const [bgImage, setBgImage] = useState(getHeroImage());

  useEffect(() => {
    setBgImage(getHeroImage());
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Rotating background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{ backgroundImage: `url('${bgImage}')` }}
      />
      {/* Warm gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-sage/80 via-sage-dark/50 to-charcoal/70" />
      {/* Light blue glow at top */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-sky/20 to-transparent" />

      {/* Floating decorative blobs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-sky/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 -right-32 w-80 h-80 bg-sand/10 rounded-full blur-3xl" />

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <p className="text-sky-light font-bold tracking-[0.2em] uppercase text-sm sm:text-base mb-6">
          A Sanctuary in Scenic, Arizona
        </p>
        <h1 className="text-5xl sm:text-6xl md:text-8xl font-extrabold text-white leading-[1.1] mb-8">
          Where Donkeys Are{" "}
          <span className="text-sky-light drop-shadow-[0_0_30px_rgba(92,205,243,0.4)]">
            Free to Dream
          </span>
        </h1>
        <p className="text-white/90 text-xl sm:text-2xl max-w-3xl mx-auto mb-12 leading-relaxed font-light">
          We rescue, rehabilitate, and provide forever homes for donkeys in
          need. Every donkey deserves a life filled with care, safety, and love.
        </p>

        <div className="flex flex-col sm:flex-row gap-5 justify-center">
          <a
            href="#donate"
            className="bg-gradient-to-r from-sky to-sky-dark text-white px-10 py-5 rounded-full text-lg font-bold transition-all hover:scale-[1.03] duration-300 shadow-[0_4px_25px_rgba(92,205,243,0.4)] hover:shadow-[0_8px_40px_rgba(92,205,243,0.5)]"
          >
            Donate Now
          </a>
          <a
            href="#donkeys"
            className="bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white px-10 py-5 rounded-full text-lg font-bold transition-all border-2 border-white/30 hover:border-white/50 duration-300"
          >
            Meet Our Donkeys
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 animate-bounce">
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

      {/* Wave bottom */}
      <div className="absolute bottom-0 left-0 right-0 leading-[0] z-10">
        <svg
          className="relative block w-full"
          style={{ height: "clamp(80px, 10vw, 150px)" }}
          viewBox="0 0 1200 200"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,100 C200,180 400,40 600,100 C800,160 1000,60 1200,100 L1200,200 L0,200 Z"
            fill="#ffffff"
          />
        </svg>
      </div>
    </section>
  );
}
