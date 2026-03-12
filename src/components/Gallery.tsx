const galleryItems = [
  { label: "Morning at the sanctuary", aspect: "aspect-square" },
  { label: "Donkeys grazing together", aspect: "aspect-[4/5]" },
  { label: "Desert sunset over the ranch", aspect: "aspect-square" },
  { label: "Volunteer day fun", aspect: "aspect-[5/4]" },
  { label: "New rescue arrival", aspect: "aspect-square" },
  { label: "Happy donkeys playing", aspect: "aspect-[4/5]" },
];

const placeholderColors = [
  "bg-sand/15",
  "bg-sage/15",
  "bg-sky/10",
  "bg-terra/10",
  "bg-sand-dark/10",
  "bg-sage-dark/10",
];

export default function Gallery() {
  return (
    <section id="gallery" className="py-24 bg-cream-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sand font-semibold tracking-widest uppercase text-sm mb-3">
            Life at the Sanctuary
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-charcoal">
            A Day at Donkey Dreams
          </h2>
        </div>

        {/* Masonry-style grid */}
        <div className="columns-2 md:columns-3 gap-4 space-y-4">
          {galleryItems.map((item, i) => (
            <div
              key={item.label}
              className={`${item.aspect} ${placeholderColors[i]} rounded-2xl overflow-hidden break-inside-avoid flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer`}
            >
              <div className="text-center p-4">
                <div className="text-4xl mb-2">📷</div>
                <p className="text-warm-gray/50 text-xs italic">
                  {item.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
