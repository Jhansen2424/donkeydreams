import Image from "next/image";

const galleryItems = [
  { label: "Morning at the sanctuary", src: "/gallery/Morning at the sanctuary.webp", aspect: "aspect-square" },
  { label: "Donkeys grazing together", src: "/gallery/Donkeys grazing together.webp", aspect: "aspect-[4/5]" },
  { label: "Desert sunset over the ranch", src: "/gallery/Desert sunset over the ranch.webp", aspect: "aspect-square" },
  { label: "Volunteer day fun", src: "/gallery/Volunteer day fun.webp", aspect: "aspect-[5/4]" },
  { label: "New rescue arrival", src: "/gallery/New rescue arrival.webp", aspect: "aspect-square" },
  { label: "Happy donkeys playing", src: "/gallery/Happy donkeys playing.webp", aspect: "aspect-[4/5]" },
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
          {galleryItems.map((item) => (
            <div
              key={item.label}
              className={`${item.aspect} rounded-2xl overflow-hidden break-inside-avoid relative group hover:opacity-90 transition-opacity cursor-pointer`}
            >
              <Image
                src={item.src}
                alt={item.label}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
