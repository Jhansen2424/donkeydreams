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
    <section id="gallery" className="relative py-28 bg-gradient-to-b from-white via-sky/3 to-cream overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-40 -right-32 w-[500px] h-[500px] bg-sky/5 rounded-full blur-3xl" />
      <div className="absolute bottom-40 -left-32 w-[400px] h-[400px] bg-sand/8 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sky font-bold tracking-[0.15em] uppercase text-sm mb-4">
            Life at the Sanctuary
          </p>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-charcoal">
            A Day at Donkey Dreams
          </h2>
        </div>

        {/* Masonry-style grid */}
        <div className="columns-2 md:columns-3 gap-5 space-y-5">
          {galleryItems.map((item) => (
            <div
              key={item.label}
              className={`${item.aspect} rounded-[2rem] overflow-hidden break-inside-avoid relative group cursor-pointer shadow-[0_4px_20px_rgba(68,98,162,0.08)] hover:shadow-[0_12px_40px_rgba(92,205,243,0.2)] transition-all duration-500 ring-4 ring-white/60`}
            >
              <Image
                src={item.src}
                alt={item.label}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover group-hover:scale-[1.03] transition-transform duration-700"
              />
              {/* Hover label */}
              <div className="absolute inset-0 bg-gradient-to-t from-sage/70 via-sage/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-5">
                <span className="text-white font-bold text-sm drop-shadow-md">{item.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
