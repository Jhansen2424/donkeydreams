export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image placeholder */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://donkeydreams.org/wp-content/uploads/2022/09/Where-the-donkeys-are-free-cropped-dnsd.jpg')",
        }}
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-charcoal/60 via-charcoal/40 to-charcoal/70" />

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <p className="text-sand-light font-medium tracking-widest uppercase text-sm mb-4">
          A Sanctuary in Scenic, Arizona
        </p>
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
          Where Donkeys Are{" "}
          <span className="text-sand-light">Free to Dream</span>
        </h1>
        <p className="text-white/80 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          We rescue, rehabilitate, and provide forever homes for donkeys in
          need. Every donkey deserves a life filled with care, safety, and love.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#donate"
            className="bg-terra hover:bg-terra-dark text-white px-8 py-4 rounded-full text-lg font-semibold transition-all hover:scale-105 shadow-lg"
          >
            Donate Now
          </a>
          <a
            href="#donkeys"
            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-full text-lg font-semibold transition-all border border-white/20"
          >
            Meet Our Donkeys
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
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
    </section>
  );
}
