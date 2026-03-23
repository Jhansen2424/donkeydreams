import type { Metadata } from "next";
import DonkeyNameTicker from "@/components/DonkeyNameTicker";
import DonkeyProfileGrid from "@/components/DonkeyProfileGrid";

export const metadata: Metadata = {
  title: "Meet the Donkeys | Donkey Dreams Sanctuary",
  description:
    "Meet the rescued donkeys of Donkey Dreams Sanctuary. Each one has a unique personality and story — get to know the herd.",
};

export default function DonkeysPage() {
  return (
    <>
      {/* Hero — full-viewport herd photo with overlay */}
      <section className="relative min-h-[85vh] flex flex-col justify-end overflow-hidden">
        {/* Background herd photo */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://donkeydreams.org/wp-content/uploads/2022/09/Where-the-donkeys-are-free-cropped-dnsd.jpg')",
          }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/50 to-charcoal/20" />

        {/* Content pinned to bottom */}
        <div className="relative z-10 px-4 sm:px-6 lg:px-8 pb-8">
          <div className="max-w-4xl mx-auto text-center mb-8">
            <p className="text-sand-light font-medium tracking-widest uppercase text-sm mb-4">
              Donkey Dreams Sanctuary
            </p>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-tight mb-6">
              Meet the Herd
            </h1>
            <p className="text-white/60 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
              50+ rescued donkeys, each with a unique story and personality.
              Tap any profile to get to know them.
            </p>
          </div>

          {/* Scrolling name ticker along the bottom */}
          <div className="border-t border-white/10 pt-4">
            <DonkeyNameTicker />
          </div>
        </div>
      </section>

      {/* Donkey profiles grid */}
      <section className="py-24 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sand font-semibold tracking-widest uppercase text-sm mb-3">
              The Family
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-charcoal mb-4">
              Get to Know Each One
            </h2>
            <p className="text-warm-gray text-lg max-w-xl mx-auto">
              Every donkey here was rescued from neglect, abandonment, or
              displacement. Click a profile to see their full story.
            </p>
          </div>

          <DonkeyProfileGrid />

          {/* More donkeys note */}
          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-3 bg-sand/10 rounded-full px-8 py-4">
              <span className="text-2xl">🫏</span>
              <p className="text-warm-gray text-sm">
                <span className="font-semibold text-charcoal">
                  More profiles coming soon!
                </span>{" "}
                We&apos;re photographing and writing up stories for all 50+
                donkeys.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sponsor CTA */}
      <section className="py-20 bg-cream-dark">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-charcoal mb-4">
            Want to Support a Donkey?
          </h2>
          <p className="text-warm-gray text-lg mb-8 max-w-xl mx-auto">
            Your sponsorship directly covers food, veterinary care, and shelter
            for a donkey in need. Choose your favorite — or let us match you!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/donate"
              className="bg-terra hover:bg-terra-dark text-white px-10 py-4 rounded-full text-lg font-semibold transition-colors shadow-lg"
            >
              Sponsor a Donkey
            </a>
            <a
              href="/#visit"
              className="bg-white hover:bg-cream border-2 border-sand/20 hover:border-sand/40 text-charcoal px-10 py-4 rounded-full text-lg font-semibold transition-all"
            >
              Visit the Sanctuary
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
