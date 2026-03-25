"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const allDonkeys = [
  {
    name: "Pink",
    personality: "The Donkey Dreams Ambassador. Born at the sanctuary, Pink is a beacon of hope, resiliency, and unconditional love.",
    profileImage: "/donkeys/pink/profile.jpeg",
  },
  {
    name: "Eli",
    personality: "Regal, reserved, and Pink's ride-or-die. Prince Eli carries a quiet confidence as the alpha Jack of his herd.",
    profileImage: "/donkeys/eli/profile-photo.jpg",
  },
  {
    name: "Shelley",
    personality: "The strongest mama in the herd. Born with a deformed leg, Shelley never gives up and teaches us all about resilience.",
    profileImage: "/donkeys/shelley/profile-photo.jpg",
  },
  {
    name: "Winnie",
    personality: "Don't judge this book by its cover. Determined and protective, Winnie proves everyone wrong every single day.",
    profileImage: "/donkeys/winnie/profile-photo.jpg",
  },
  {
    name: "Fernie",
    personality: "She waited a long time — but she made it. After years of moving, Fernie finally found her forever home at Donkey Dreams.",
    profileImage: "/donkeys/fernie/profile-photo.jpg",
  },
  {
    name: "Sandy",
    personality: "Pink's mom and the \"fun mom\" of the sanctuary. A wild Jenny from Death Valley who loves rolling in the dirt with her kids.",
    profileImage: "/donkeys/sandy/profile-photo.jpg",
  },
  {
    name: "Rizzo",
    personality: "Eli's mom and Pink's second mom. A peaceful grazer from Death Valley who actually looks like she's smiling when she eats.",
    profileImage: "/donkeys/rizzo/profile-photo.jpg",
  },
  {
    name: "Pete",
    personality: "28 years old and living his best life. Pete is proof that it's never too late for a new chapter — or a new girlfriend.",
    profileImage: "/donkeys/pete/profile-photo.jpg",
  },
  {
    name: "Lila",
    personality: "Pete's girlfriend and big sis to the herd. A supermodel Jenny from Death Valley who lights up the sanctuary.",
    profileImage: "/donkeys/lila/profile-picture.png",
  },
];

const ROTATE_HOURS = 4;
const DONKEYS_PER_PAGE = 4;

const blobShapes = [
  "30% 70% 70% 30% / 30% 30% 70% 70%",
  "70% 30% 30% 70% / 60% 40% 60% 40%",
  "40% 60% 50% 50% / 35% 65% 35% 65%",
  "60% 40% 65% 35% / 45% 55% 45% 55%",
];

function getFeaturedDonkeys() {
  const rotation = Math.floor(Date.now() / (ROTATE_HOURS * 60 * 60 * 1000));
  const startIndex = (rotation * DONKEYS_PER_PAGE) % allDonkeys.length;
  const featured = [];
  for (let i = 0; i < DONKEYS_PER_PAGE; i++) {
    featured.push(allDonkeys[(startIndex + i) % allDonkeys.length]);
  }
  return featured;
}

export default function FeaturedDonkeys() {
  const [donkeys, setDonkeys] = useState(getFeaturedDonkeys());

  useEffect(() => {
    setDonkeys(getFeaturedDonkeys());
  }, []);

  return (
    <section id="donkeys" className="relative py-28 bg-gradient-to-b from-cream via-white to-sky/5 overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-32 -left-20 w-72 h-72 bg-sky/8 rounded-full blur-3xl" />
      <div className="absolute bottom-20 -right-20 w-96 h-96 bg-sand/8 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sky font-bold tracking-[0.15em] uppercase text-sm mb-4">
            Meet the Herd
          </p>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-charcoal">
            Our Beloved Donkeys
          </h2>
        </div>

        {/* Featured donkey cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {donkeys.map((donkey, i) => (
            <a
              key={donkey.name}
              href="/donkeys"
              className="group"
            >
              <div className="relative">
                {/* Blob shape behind image */}
                <div
                  className="absolute -inset-3 bg-gradient-to-br from-sky/15 to-sand/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  style={{ borderRadius: blobShapes[i % blobShapes.length] }}
                />
                <div className="relative bg-white rounded-[2rem] overflow-hidden shadow-[0_4px_25px_rgba(68,98,162,0.08)] hover:shadow-[0_12px_40px_rgba(92,205,243,0.2)] transition-all duration-500 h-full">
                  <div className="aspect-square relative overflow-hidden">
                    <Image
                      src={donkey.profileImage}
                      alt={donkey.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover group-hover:scale-[1.04] transition-transform duration-700"
                    />
                    {/* Soft gradient at bottom of image */}
                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-white/40 to-transparent" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-extrabold text-charcoal mb-2">
                      {donkey.name}
                    </h3>
                    <p className="text-warm-gray text-sm leading-relaxed">
                      {donkey.personality}
                    </p>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>

        <div className="text-center mt-12">
          <a
            href="/donkeys"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-sky/15 to-sky/5 hover:from-sky/25 hover:to-sky/15 text-sky-dark px-8 py-4 rounded-full font-bold transition-all duration-300 text-lg"
          >
            Meet All Our Donkeys
            <svg
              className="w-5 h-5"
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

      {/* Wave divider to next section */}
      <div className="absolute bottom-0 left-0 right-0 leading-[0]">
        <svg
          className="relative block w-full"
          style={{ height: "clamp(50px, 6vw, 100px)" }}
          viewBox="0 0 1200 200"
          preserveAspectRatio="none"
        >
          <path
            d="M0,80 C200,140 400,20 600,100 C800,160 1000,60 1200,80 L1200,200 L0,200 Z"
            fill="#FDF8F0"
          />
        </svg>
      </div>
    </section>
  );
}
