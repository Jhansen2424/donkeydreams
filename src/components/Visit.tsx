export default function Visit() {
  return (
    <section id="visit" className="py-24 bg-cream-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Visit info */}
          <div>
            <p className="text-sky font-semibold tracking-widest uppercase text-sm mb-3">
              Come See Us
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-charcoal mb-6">
              Visit the Sanctuary
            </h2>
            <p className="text-warm-gray text-lg leading-relaxed mb-8">
              Meet our donkeys in person! We welcome visitors and volunteers
              year-round. Come experience the magic of Donkey Dreams and see
              firsthand the difference your support makes.
            </p>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-sky/10 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-sky"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-charcoal mb-1">Location</h3>
                  <p className="text-warm-gray text-sm">
                    Scenic, AZ — Nestled in the beautiful Mojave Desert
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-sage/10 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-sage"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-charcoal mb-1">
                    Visiting Hours
                  </h3>
                  <p className="text-warm-gray text-sm">
                    Saturdays &amp; Sundays, 9am – 3pm
                    <br />
                    Weekday visits by appointment
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-terra/10 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-terra"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-charcoal mb-1">
                    Volunteer
                  </h3>
                  <p className="text-warm-gray text-sm">
                    Help with feeding, grooming, and maintenance.
                    <br />
                    Email us to get started!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Google Maps embed — Scenic, AZ */}
          <div className="rounded-3xl overflow-hidden min-h-[400px]">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d25889.04844648!2d-113.95!3d36.28!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80c9a1f3b3b3b3b3%3A0x0!2sScenic%2C+AZ!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: 400 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Donkey Dreams Sanctuary — Scenic, AZ"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
