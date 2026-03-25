export default function Impact() {
  return (
    <>
      {/* Wave into impact */}
      <div className="relative leading-[0] -my-px bg-cream">
        <svg
          className="relative block w-full"
          style={{ height: "clamp(50px, 6vw, 100px)" }}
          viewBox="0 0 1200 200"
          preserveAspectRatio="none"
        >
          <path
            d="M0,60 C300,140 500,20 700,80 C900,140 1100,60 1200,100 L1200,200 L0,200 Z"
            fill="#ffffff"
          />
        </svg>
      </div>

      <section className="relative py-28 bg-gradient-to-b from-white to-sky/5 overflow-hidden">
        {/* Blob */}
        <div className="absolute top-1/2 -translate-y-1/2 -left-40 w-[500px] h-[500px] bg-sky/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Image placeholder with blob behind */}
            <div className="relative">
              <div
                className="absolute -inset-6 bg-gradient-to-br from-sky/15 to-sand/10 blur-2xl"
                style={{ borderRadius: "40% 60% 55% 45% / 35% 55% 45% 65%" }}
              />
              <div className="relative bg-gradient-to-br from-sky/10 to-sand/10 rounded-[2rem] aspect-[4/3] flex items-center justify-center ring-4 ring-white/60">
                <div className="text-center">
                  <div className="text-6xl mb-3">🫏</div>
                  <p className="text-warm-gray/50 text-sm italic">
                    Before &amp; after rescue photo
                  </p>
                </div>
              </div>
            </div>

            {/* Story */}
            <div>
              <p className="text-sky font-bold tracking-[0.15em] uppercase text-sm mb-3">
                Your Impact
              </p>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-charcoal mb-6">
                From Neglect to{" "}
                <span className="text-sky">New Beginnings</span>
              </h2>

              <div className="space-y-6 text-warm-gray leading-relaxed text-lg">
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
                <p className="font-semibold text-charcoal">
                  Stories like Dusty&apos;s are only possible because of donors like
                  you.
                </p>
              </div>

              <a
                href="#donate"
                className="inline-flex items-center gap-2 mt-8 bg-gradient-to-r from-sky to-sky-dark hover:from-sky-dark hover:to-sky text-white px-8 py-4 rounded-full font-bold transition-all duration-300 shadow-[0_4px_25px_rgba(92,205,243,0.3)]"
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
    </>
  );
}
