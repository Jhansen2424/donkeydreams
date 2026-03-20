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

        {/* Featured donkey cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {donkeys.map((donkey) => (
            <a
              key={donkey.name}
              href="/donkeys"
              className="group"
            >
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 border border-sand/10 h-full">
                <div className="aspect-square relative overflow-hidden">
                  <Image
                    src={donkey.profileImage}
                    alt={donkey.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
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
            </a>
          ))}
        </div>

        <div className="text-center mt-8">
          <a
            href="/donkeys"
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
