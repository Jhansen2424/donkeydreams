"use client";

const donkeys = [
  {
    name: "Dusty",
    personality: "The gentle leader of the herd. Dusty loves chin scratches and greeting visitors at the gate.",
    color: "bg-sand/20",
  },
  {
    name: "Pepper",
    personality: "A spunky little gal who was rescued from a neglect case. Now she's the first one to the feed bucket!",
    color: "bg-sage/20",
  },
  {
    name: "Biscuit",
    personality: "Our oldest resident at 28 years young. Biscuit enjoys long naps in the sunshine.",
    color: "bg-sky/10",
  },
  {
    name: "Clover",
    personality: "A curious youngster who follows volunteers around like a puppy. She loves apples!",
    color: "bg-terra/10",
  },
  {
    name: "Shadow",
    personality: "A shy boy who came to us underweight and scared. Now he's the biggest cuddle bug on the ranch.",
    color: "bg-sand/20",
  },
  {
    name: "Rosie",
    personality: "Our social butterfly who makes friends with every animal on the sanctuary.",
    color: "bg-sage/20",
  },
];

export default function FeaturedDonkeys() {
  return (
    <section id="donkeys" className="py-24 bg-cream-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sand font-semibold tracking-widest uppercase text-sm mb-3">
            Meet the Herd
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-charcoal">
            Our Beloved Donkeys
          </h2>
        </div>

        {/* Scrollable cards */}
        <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
          {donkeys.map((donkey) => (
            <div
              key={donkey.name}
              className="flex-shrink-0 w-72 snap-start"
            >
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 border border-sand/10">
                {/* Photo placeholder */}
                <div
                  className={`h-64 ${donkey.color} flex items-center justify-center`}
                >
                  <div className="text-center">
                    <div className="text-6xl mb-2">🫏</div>
                    <p className="text-warm-gray/60 text-xs italic">
                      Photo coming soon
                    </p>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-charcoal mb-2">
                    {donkey.name}
                  </h3>
                  <p className="text-warm-gray text-sm leading-relaxed">
                    {donkey.personality}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <a
            href="#"
            className="inline-flex items-center gap-2 text-sky hover:text-sky-dark font-semibold transition-colors"
          >
            Meet All Our Donkeys
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
    </section>
  );
}
