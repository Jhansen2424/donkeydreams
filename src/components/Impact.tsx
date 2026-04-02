"use client";

import { useState } from "react";

export default function Impact() {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {/* Wave into impact */}
      <div className="relative leading-[0] -my-px bg-cream">
        <svg
          className="relative block w-full"
          style={{ height: "clamp(50px, 6vw, 100px)" }}
          viewBox="0 0 1200 200"
          preserveAspectRatio="none"
        >
          <path
            d="M0,60 C300,140 500,20 700,80 C900,140 1100,60 1200,100 L1200,200 L0,200 Z"
            fill="#ffffff"
          />
        </svg>
      </div>

      <section className="relative py-28 bg-gradient-to-b from-white to-sky/5 overflow-hidden">
        {/* Blob */}
        <div className="absolute top-1/2 -translate-y-1/2 -left-40 w-[500px] h-[500px] bg-sky/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Image placeholder with blob behind */}
            <div className="relative">
              <div
                className="absolute -inset-6 bg-gradient-to-br from-sky/15 to-sand/10 blur-2xl"
                style={{ borderRadius: "40% 60% 55% 45% / 35% 55% 45% 65%" }}
              />
              <div className="relative bg-gradient-to-br from-sky/10 to-sand/10 rounded-[2rem] aspect-[4/3] flex items-center justify-center ring-4 ring-white/60">
                <div className="text-center">
                  <div className="text-6xl mb-3">🫏</div>
                  <p className="text-warm-gray/50 text-sm italic">
                    Gabriel&apos;s rescue photo
                  </p>
                </div>
              </div>
            </div>

            {/* Story */}
            <div>
              <p className="text-sky font-bold tracking-[0.15em] uppercase text-sm mb-3">
                Your Impact
              </p>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-charcoal mb-6">
                Meet <span className="text-sky">Gabriel</span>
              </h2>

              <div className="space-y-6 text-warm-gray leading-relaxed text-lg">
                <p>
                  Gabriel is the most recent donkey to join our Donkey Dreams
                  family, and what a journey he&apos;s had. As a baby in the wild,
                  Gabriel survived alone with part of his back leg missing. A
                  cattle rancher found him, and three days later, a friend
                  connected us.
                </p>
                <p>
                  We drove hours to pick him up, then to the vet, and finally
                  home to Donkey Dreams. Amazingly, despite his thin body and
                  amputated leg, his blood work was normal. Then the real work
                  began.
                </p>

                {/* Expandable content */}
                <div
                  className={`grid transition-all duration-500 ease-in-out ${
                    expanded
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="space-y-6">
                      <p>
                        From the moment he arrived, Gabriel&apos;s love of connecting
                        with other donkeys was clear. He longed to join a donkey
                        herd but needed time to heal his leg and gain weight first.
                        His matted coat became a canvas for our daily brushings and
                        cuddles, and we watched in awe as he focused on gaining
                        strength, interspersed with well-earned naps.
                      </p>
                      <p>
                        Gabriel taught us something important: even after great
                        loss, trust and love can flourish. Adjusting to life at
                        Donkey Dreams wasn&apos;t easy. For the first time, he
                        experienced different food and water sources, fenced
                        enclosures, and human care. But with patience, he began to
                        thrive.
                      </p>
                      <p>
                        And then came the <strong>Magic Leg</strong>. After over 75
                        daily bandage changes and a major growth spurt,
                        Gabriel&apos;s first test run with his prosthetic was nothing
                        short of miraculous. He stood, then ran, with pure joy and
                        no hesitation. He adapted quickly, and each day he grew
                        more agile and confident.
                      </p>
                      <p>
                        Soon, he was ready to join the <strong>Brave Herd</strong>.
                        With Asher guiding him and Halo becoming his primary
                        playmate, he learned social cues, boundaries, and
                        friendship. For the first time at Donkey Dreams, Gabriel
                        was content and at peace.
                      </p>
                      <p>
                        Gabriel&apos;s journey is not over. As a growing donkey, he
                        will need several more magic legs. Fortunately, the top
                        equine amputee and prosthetic veterinarian is willing to
                        help Gabriel with a short-term and long-term care plan.
                      </p>
                    </div>
                  </div>
                </div>

                <p className="font-semibold text-charcoal">
                  Stories like Gabriel&apos;s are only possible because of donors
                  like you.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-8">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="inline-flex items-center gap-2 text-sky hover:text-sky-dark font-bold transition-colors duration-300 cursor-pointer"
                >
                  {expanded ? "Read Less" : "Read Gabriel's Full Story"}
                  <svg
                    className={`w-4 h-4 transition-transform duration-300 ${
                      expanded ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                <a
                  href="#donate"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-sky to-sky-dark hover:from-sky-dark hover:to-sky text-white px-8 py-4 rounded-full font-bold transition-all duration-300 shadow-[0_4px_25px_rgba(92,205,243,0.3)]"
                >
                  Help Gabriel&apos;s Journey
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
          </div>
        </div>
      </section>
    </>
  );
}
