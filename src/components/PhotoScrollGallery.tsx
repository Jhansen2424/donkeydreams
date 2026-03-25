"use client";

import { useState } from "react";

// Placeholder images — replace with real sanctuary photos
const topRow = [
  "https://donkeydreams.org/wp-content/uploads/2024/01/IMG_8633-scaled.jpg",
  "https://donkeydreams.org/wp-content/uploads/2024/01/IMG_8488-scaled.jpg",
  "https://donkeydreams.org/wp-content/uploads/2022/09/Where-the-donkeys-are-free-cropped-dnsd.jpg",
  "https://donkeydreams.org/wp-content/uploads/2024/01/IMG_8543-scaled.jpg",
  "https://donkeydreams.org/wp-content/uploads/2024/01/IMG_8490-scaled.jpg",
  "https://donkeydreams.org/wp-content/uploads/2024/01/IMG_7849-scaled.jpg",
];

const bottomRow = [
  "https://donkeydreams.org/wp-content/uploads/2024/01/IMG_7849-scaled.jpg",
  "https://donkeydreams.org/wp-content/uploads/2024/01/IMG_8543-scaled.jpg",
  "https://donkeydreams.org/wp-content/uploads/2024/01/IMG_8633-scaled.jpg",
  "https://donkeydreams.org/wp-content/uploads/2022/09/Where-the-donkeys-are-free-cropped-dnsd.jpg",
  "https://donkeydreams.org/wp-content/uploads/2024/01/IMG_8488-scaled.jpg",
  "https://donkeydreams.org/wp-content/uploads/2024/01/IMG_8490-scaled.jpg",
];

function PhotoLightbox({
  src,
  onClose,
}: {
  src: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-sage-dark/90 backdrop-blur-md"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:bg-white transition-colors cursor-pointer"
      >
        <svg className="w-5 h-5 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <img
        src={src}
        alt="Donkey Dreams Sanctuary"
        className="max-w-full max-h-[90vh] object-contain rounded-[2rem] shadow-2xl ring-4 ring-white/20"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export default function PhotoScrollGallery() {
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);

  return (
    <>
      <style jsx global>{`
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes scroll-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
      `}</style>

      <section className="relative py-20 bg-gradient-to-b from-sky/5 via-white to-cream overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-20 left-1/4 w-80 h-80 bg-sky/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-60 h-60 bg-sand/8 rounded-full blur-3xl" />

        <div className="relative text-center mb-12 px-4">
          <p className="text-sky font-bold tracking-[0.15em] uppercase text-sm mb-4">
            Life at the Sanctuary
          </p>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-charcoal">
            Moments from the Herd
          </h2>
        </div>

        {/* Top row — scrolls left */}
        <div className="mb-5 overflow-hidden">
          <div
            className="flex gap-5 w-max"
            style={{ animation: "scroll-left 40s linear infinite" }}
          >
            {[...topRow, ...topRow].map((src, i) => (
              <button
                key={i}
                onClick={() => setExpandedPhoto(src)}
                className="flex-shrink-0 w-72 sm:w-80 aspect-[4/3] rounded-[2rem] overflow-hidden shadow-[0_4px_20px_rgba(68,98,162,0.08)] hover:shadow-[0_12px_40px_rgba(92,205,243,0.2)] transition-all duration-500 cursor-pointer group ring-4 ring-white/60"
              >
                <img
                  src={src}
                  alt="Sanctuary life"
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Bottom row — scrolls right */}
        <div className="overflow-hidden">
          <div
            className="flex gap-5 w-max"
            style={{ animation: "scroll-right 45s linear infinite" }}
          >
            {[...bottomRow, ...bottomRow].map((src, i) => (
              <button
                key={i}
                onClick={() => setExpandedPhoto(src)}
                className="flex-shrink-0 w-72 sm:w-80 aspect-[4/3] rounded-[2rem] overflow-hidden shadow-[0_4px_20px_rgba(68,98,162,0.08)] hover:shadow-[0_12px_40px_rgba(92,205,243,0.2)] transition-all duration-500 cursor-pointer group ring-4 ring-white/60"
              >
                <img
                  src={src}
                  alt="Sanctuary life"
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                />
              </button>
            ))}
          </div>
        </div>
      </section>

      {expandedPhoto && (
        <PhotoLightbox
          src={expandedPhoto}
          onClose={() => setExpandedPhoto(null)}
        />
      )}
    </>
  );
}
