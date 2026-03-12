export default function Impact() {
  return (
    <section className="py-24 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Image placeholder */}
          <div className="bg-sand/10 rounded-3xl aspect-[4/3] flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-3">🫏</div>
              <p className="text-warm-gray/50 text-sm italic">
                Before &amp; after rescue photo
              </p>
            </div>
          </div>

          {/* Story */}
          <div>
            <p className="text-sage font-semibold tracking-widest uppercase text-sm mb-3">
              Your Impact
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-charcoal mb-6">
              From Neglect to{" "}
              <span className="text-sage-dark">New Beginnings</span>
            </h2>

            <div className="space-y-6 text-warm-gray leading-relaxed">
              <p>
                When Dusty arrived at Donkey Dreams, he was 200 pounds
                underweight, with overgrown hooves and a deep fear of humans. He
                had been found abandoned in a vacant lot, surviving on scraps.
              </p>
              <p>
                After months of patient care, proper nutrition, and veterinary
                attention, Dusty transformed. Today, he&apos;s the first to greet
                visitors at the gate, with a shiny coat and a spirit full of
                trust.
              </p>
              <p className="font-medium text-charcoal">
                Stories like Dusty&apos;s are only possible because of donors like
                you.
              </p>
            </div>

            <a
              href="#donate"
              className="inline-flex items-center gap-2 mt-8 bg-sage hover:bg-sage-dark text-white px-8 py-3.5 rounded-full font-semibold transition-colors"
            >
              Help the Next Dusty
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
