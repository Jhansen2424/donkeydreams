const stats = [
  { number: "50+", label: "Donkeys Rescued" },
  { number: "40", label: "Acres of Sanctuary" },
  { number: "2015", label: "Year Founded" },
  { number: "100%", label: "Donation to Care" },
];

export default function Mission() {
  return (
    <section id="mission" className="relative py-24 bg-cream overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section text */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-sand font-semibold tracking-widest uppercase text-sm mb-3">
            Our Story
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-charcoal mb-6">
            Every Donkey Deserves a{" "}
            <span className="text-sand-dark">Forever Home</span>
          </h2>
          <p className="text-warm-gray text-lg leading-relaxed">
            Donkey Dreams Sanctuary is dedicated to rescuing donkeys from
            neglect, abuse, and abandonment. Nestled in the scenic Arizona
            desert, we provide a safe haven where these gentle, intelligent
            animals can heal, thrive, and live out their lives in peace.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl p-8 text-center shadow-sm border border-sand/10 hover:shadow-md transition-shadow"
            >
              <div className="text-3xl sm:text-4xl font-bold text-sky mb-2">
                {stat.number}
              </div>
              <div className="text-warm-gray text-sm font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}
