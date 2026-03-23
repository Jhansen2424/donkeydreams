export default function VirtualVisitPricing() {
  return (
    <section className="py-20 bg-cream">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Pricing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Standard */}
          <div className="bg-white rounded-2xl p-8 shadow-md border border-cream-dark">
            <p className="text-warm-gray text-sm uppercase tracking-wider mb-2">
              Standard Visit
            </p>
            <p className="text-5xl font-bold text-charcoal mb-1">$75</p>
            <p className="text-warm-gray text-lg">30 minutes</p>
            <p className="text-warm-gray/70 text-sm mt-3">
              Your own private live donkey experience
            </p>
          </div>

          {/* Welcome Special */}
          <div className="relative bg-white rounded-2xl p-8 shadow-md border-2 border-terra">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-terra text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
              Welcome Special
            </span>
            <p className="text-warm-gray text-sm uppercase tracking-wider mb-2">
              First 150 Visits
            </p>
            <p className="text-5xl font-bold text-charcoal mb-1">$50</p>
            <p className="text-warm-gray text-lg">30 minutes</p>
            <p className="text-warm-gray/70 text-sm mt-3">
              Same experience — limited availability
            </p>
          </div>
        </div>

        <a
          href="#book"
          className="mt-10 inline-block bg-terra hover:bg-terra-dark text-white px-10 py-4 rounded-full text-lg font-semibold transition-all hover:scale-105 shadow-lg"
        >
          Book a Visit
        </a>
      </div>
    </section>
  );
}
