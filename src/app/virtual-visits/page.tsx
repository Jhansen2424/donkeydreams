import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Virtual Visits | Donkey Dreams Sanctuary",
  description:
    "Enjoy your own private virtual visit with the donkeys at Donkey Dreams Sanctuary in Scenic, Arizona.",
};

export default function VirtualVisitsPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-20 bg-charcoal overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-no-repeat opacity-30"
          style={{
            backgroundImage: "url('/virtual visit hero.webp')",
            backgroundPosition: "center 30%",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/60 via-charcoal/40 to-charcoal/70" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            Virtual Visits
          </h1>
          <p className="text-white/70 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            Meet our donkeys from anywhere in the world — a private, personal
            experience with the herd.
          </p>
        </div>
      </section>

      {/* Content placeholder — will be filled with copy from donkeydreams.org */}
      <section className="py-24 bg-cream">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-warm-gray text-lg">
            Content coming soon — check back shortly!
          </p>
        </div>
      </section>
    </>
  );
}
