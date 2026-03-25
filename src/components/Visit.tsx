export default function Visit() {
  return (
    <>
      {/* Wave divider */}
      <div className="relative leading-[0] -my-px">
        <svg
          className="relative block w-full"
          style={{ height: "clamp(50px, 6vw, 100px)" }}
          viewBox="0 0 1200 200"
          preserveAspectRatio="none"
        >
          <path
            d="M0,100 C200,40 400,160 600,80 C800,0 1000,120 1200,60 L1200,200 L0,200 Z"
            fill="#4462a2"
          />
        </svg>
      </div>

      <section id="visit" className="relative py-24 bg-gradient-to-b from-sage to-sage-dark overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-20 -right-20 w-80 h-80 bg-sky/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 -left-20 w-60 h-60 bg-sand/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Visit info */}
            <div>
              <p className="text-sky-light font-bold tracking-[0.15em] uppercase text-sm mb-3">
                Come See Us
              </p>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-6">
                Visit the Sanctuary
              </h2>
              <p className="text-white/80 text-lg leading-relaxed mb-8">
                Meet our donkeys in person! We welcome visitors and volunteers
                year-round. Come experience the magic of Donkey Dreams and see
                firsthand the difference your support makes.
              </p>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-sky/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-sky-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-1">Location</h3>
                    <p className="text-white/70 text-sm">
                      Scenic, AZ — Nestled in the beautiful Mojave Desert
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-sky/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-sky-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-1">Visiting Hours</h3>
                    <p className="text-white/70 text-sm">
                      Saturdays &amp; Sundays, 9am – 3pm
                      <br />
                      Weekday visits by appointment
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-sand/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-sand-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-1">Volunteer</h3>
                    <p className="text-white/70 text-sm">
                      Help with feeding, grooming, and maintenance.
                      <br />
                      Email us to get started!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Google Maps embed */}
            <div className="rounded-[2rem] overflow-hidden min-h-[400px] ring-4 ring-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.2)]">
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

      {/* Wave out of visit section */}
      <div className="relative leading-[0] -my-px">
        <svg
          className="relative block w-full rotate-180"
          style={{ height: "clamp(50px, 6vw, 100px)" }}
          viewBox="0 0 1200 200"
          preserveAspectRatio="none"
        >
          <path
            d="M0,80 C200,150 400,30 600,100 C800,170 1000,50 1200,80 L1200,200 L0,200 Z"
            fill="#344d80"
          />
        </svg>
      </div>
    </>
  );
}
