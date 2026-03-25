const stats = [
  { number: "50+", label: "Donkeys Rescued" },
  { number: "40", label: "Acres of Sanctuary" },
  { number: "2015", label: "Year Founded" },
  { number: "100%", label: "Donation to Care" },
];

export default function Mission() {
  return (
    <>
      {/* Mission text — white bg flowing from hero wave */}
      <section id="mission" className="relative py-28 bg-gradient-to-b from-white via-white to-sky/5 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-20 -right-40 w-[500px] h-[500px] bg-sky/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 -left-40 w-[400px] h-[400px] bg-sand/8 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sky font-bold tracking-[0.15em] uppercase text-sm mb-4">
              Our Mission
            </p>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-charcoal mb-8 leading-tight">
              Every Donkey Deserves a{" "}
              <span className="text-sky">Forever Home</span>
            </h2>
            <p className="text-warm-gray text-xl leading-relaxed">
              Donkey Dreams Sanctuary is dedicated to rescuing donkeys from
              neglect, abuse, and abandonment. Nestled in the scenic Arizona
              desert, we provide a safe haven where these gentle, intelligent
              animals can heal, thrive, and live out their lives in peace.
            </p>
          </div>
        </div>
      </section>

      {/* Wave into stats */}
      <div className="relative leading-[0] -my-px">
        <svg
          className="relative block w-full"
          style={{ height: "clamp(50px, 6vw, 100px)" }}
          viewBox="0 0 1200 200"
          preserveAspectRatio="none"
        >
          <path
            d="M0,80 C300,160 600,0 900,100 C1050,150 1150,80 1200,100 L1200,200 L0,200 Z"
            fill="#5ccdf3"
          />
        </svg>
      </div>

      {/* Sky-blue stats banner */}
      <section className="bg-gradient-to-r from-sky to-sky-dark py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl sm:text-5xl font-extrabold text-white mb-1">
                  {stat.number}
                </div>
                <div className="text-white/80 text-sm font-semibold uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Wave out of stats */}
      <div className="relative leading-[0] -my-px">
        <svg
          className="relative block w-full rotate-180"
          style={{ height: "clamp(50px, 6vw, 100px)" }}
          viewBox="0 0 1200 200"
          preserveAspectRatio="none"
        >
          <path
            d="M0,60 C200,140 400,20 600,80 C800,140 1000,40 1200,80 L1200,200 L0,200 Z"
            fill="#5ccdf3"
          />
        </svg>
      </div>
    </>
  );
}
