"use client";

import { useState, useEffect, useRef } from "react";

/* ──────────────────────────────────────────────
   Section 1 — Hero
   ────────────────────────────────────────────── */
function DonateHero() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="relative pt-32 pb-24 bg-charcoal overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-no-repeat opacity-25"
        style={{
          backgroundImage: "url('/herd of donkeys.webp')",
          backgroundPosition: "center 40%",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-charcoal/60 via-charcoal/40 to-charcoal/80" />

      <div
        className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        style={{
          transition: "opacity 0.8s ease-out, transform 0.8s ease-out",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(30px)",
        }}
      >
        <p className="text-sand-light font-medium tracking-widest uppercase text-sm mb-4">
          Help Keep Their Dreams Alive
        </p>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
          Donate <span className="text-sand-light">Today</span>
        </h1>
        <p className="text-white/70 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-8">
          Donkeys at our sanctuary come from challenging backgrounds, and
          providing them with the highest level of care is costly but essential.
          Your donation gives a donkey the much needed support that every
          precious life deserves!
        </p>
        <a
          href="#donate-now"
          className="inline-block bg-terra hover:bg-terra-dark text-white px-10 py-4 rounded-full text-lg font-semibold transition-all hover:scale-105 shadow-lg"
        >
          Make a Life-Saving Donation
        </a>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   Section 2 — Impact Statement
   ────────────────────────────────────────────── */
function ImpactStatement() {
  return (
    <section className="py-20 bg-cream">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sand font-semibold tracking-widest uppercase text-sm mb-3">
          Join Our Herd of Supporters
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold text-charcoal mb-8">
          Make a Difference in a Donkey&apos;s Life
        </h2>
        <p className="text-warm-gray text-lg leading-relaxed">
          You help cover critical needs like veterinary bills, specialized
          rehabilitation (like prosthetics!), and provide the daily love and
          attention our residents require.
        </p>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   Section 3 — Three Pillars
   ────────────────────────────────────────────── */
const pillars = [
  {
    icon: (
      <svg className="w-10 h-10 text-terra" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
    title: "Keeping Families Together",
    description:
      "You make it possible to keep families together in a forever sanctuary and permanently safe from slaughter and separation. For wild burros, we also do what we can to preserve their wild spirit, independence and freedom.",
  },
  {
    icon: (
      <svg className="w-10 h-10 text-sky" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
      </svg>
    ),
    title: "A Forever Home for Seniors & Special Needs",
    description:
      "You help provide a forever home to seniors and special needs individuals. It is our core mission to save families, but compassion led us to make exceptions and rescue a few dozen senior and special-needs donkeys.",
  },
  {
    icon: (
      <svg className="w-10 h-10 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
    title: "Compassion Over Convenience",
    description:
      "Because old or disabled animals are often cruelly discarded or killed, we simply refused to let that happen. Instead, we chose to bring them into our home and our hearts.",
  },
];

function ThreePillars() {
  return (
    <section className="py-20 bg-cream-dark">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-3 gap-8">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="bg-white rounded-2xl p-8 shadow-sm border border-cream-dark text-center hover:shadow-md transition-shadow"
            >
              <div className="flex justify-center mb-4">{pillar.icon}</div>
              <h3 className="text-xl font-bold text-charcoal mb-3">
                {pillar.title}
              </h3>
              <p className="text-warm-gray text-sm leading-relaxed">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   Section 4 — 100% Callout Banner
   ────────────────────────────────────────────── */
function FullDonationBanner() {
  return (
    <section className="py-16 bg-terra">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          100% of Donations Go Directly to the Donkeys
        </h2>
        <p className="text-white/80 text-lg max-w-2xl mx-auto leading-relaxed">
          Our sanctuary fully operates as a labor of love. You fund it all —
          from their food, hoof care, medical care, special needs, and
          improvements to their homes. You make their home a true sanctuary of
          love and safety!
        </p>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   Section 5 — What Your Donation Funds
   ────────────────────────────────────────────── */
const fundItems = [
  { icon: "🌾", label: "Food & Nutrition" },
  { icon: "🦶", label: "Hoof Care" },
  { icon: "🩺", label: "Medical Care" },
  { icon: "♿", label: "Special Needs" },
  { icon: "🏠", label: "Home Improvements" },
  { icon: "💊", label: "Rehabilitation" },
];

function DonationFunds() {
  return (
    <section className="py-20 bg-cream">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sand font-semibold tracking-widest uppercase text-sm mb-3">
            Where Your Money Goes
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-charcoal">
            What Your Donation Funds
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
          {fundItems.map((item) => (
            <div
              key={item.label}
              className="bg-white rounded-2xl p-6 shadow-sm border border-cream-dark text-center hover:shadow-md transition-shadow"
            >
              <span className="text-4xl mb-3 block">{item.icon}</span>
              <p className="text-charcoal font-semibold">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   Section 6 — Donate CTA + Payment Methods
   ────────────────────────────────────────────── */
function DonatePayment() {
  return (
    <section className="py-20 bg-cream-dark" id="donate-now">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-charcoal mb-4">
            Yes, I Want to Give a Gift to the Donkey Families!
          </h2>
          <p className="text-warm-gray text-lg">
            Choose the donation method that works best for you.
          </p>
        </div>

        {/* Donkey image */}
        <div className="rounded-2xl overflow-hidden shadow-md mb-12">
          <img
            src="/person with donkey.webp"
            alt="Person with donkeys at Donkey Dreams Sanctuary"
            className="w-full h-auto object-cover"
            style={{ maxHeight: "400px", objectPosition: "center" }}
          />
        </div>

        {/* PRIMARY — Zeffy */}
        <div className="bg-white rounded-2xl p-8 sm:p-10 shadow-md border border-cream-dark text-center mb-10">
          <p className="text-terra font-semibold tracking-widest uppercase text-xs mb-2">
            Recommended
          </p>
          <h3 className="text-2xl font-bold text-charcoal mb-3">
            Donate with Zeffy
          </h3>
          <p className="text-warm-gray mb-6 max-w-lg mx-auto">
            Zeffy is a 100% free donation platform for nonprofits — every dollar
            you give goes directly to our donkeys.
          </p>
          <a
            href="https://www.zeffy.com/PLACEHOLDER"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-terra hover:bg-terra-dark text-white px-10 py-4 rounded-full text-lg font-semibold transition-all hover:scale-105 shadow-lg"
          >
            Donate via Zeffy
          </a>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 my-10">
          <div className="flex-1 border-t border-sand/30" />
          <span className="text-warm-gray text-sm font-medium">Other Ways to Give</span>
          <div className="flex-1 border-t border-sand/30" />
        </div>

        {/* SECONDARY — PayPal, Venmo, Zelle, Mail */}
        <div className="grid sm:grid-cols-2 gap-6">
          {/* PayPal */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-cream-dark text-center">
            <h3 className="text-xl font-bold text-charcoal mb-2">PayPal</h3>
            <a
              href="https://www.paypal.com/donate/?hosted_button_id=PLACEHOLDER"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#0070ba] hover:bg-[#005ea6] text-white px-8 py-3 rounded-full font-semibold transition-all hover:scale-105 shadow-md mt-2"
            >
              Donate via PayPal
            </a>
          </div>

          {/* Venmo */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-cream-dark text-center">
            <h3 className="text-xl font-bold text-charcoal mb-2">Venmo</h3>
            <p className="text-warm-gray mt-2">
              Find us at{" "}
              <span className="text-terra font-semibold">
                @DonkeyDreamsSanctuary
              </span>
            </p>
          </div>

          {/* Zelle */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-cream-dark text-center">
            <h3 className="text-xl font-bold text-charcoal mb-2">Zelle</h3>
            <p className="text-warm-gray mt-2">
              Send to{" "}
              <span className="text-terra font-semibold">
                donkeydreamssanctuary@gmail.com
              </span>
            </p>
          </div>

          {/* Mail a Check */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-cream-dark text-center">
            <h3 className="text-xl font-bold text-charcoal mb-2">
              Mail a Check
            </h3>
            <div className="text-warm-gray leading-relaxed mt-2">
              <p className="font-semibold text-charcoal">Donkey Dreams</p>
              <p>PO Box 951</p>
              <p>Littlefield, AZ 86432</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   Section 7 — Thank You
   ────────────────────────────────────────────── */
function ThankYou() {
  return (
    <section className="py-20 bg-cream">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-charcoal">
          Thank You!
        </h2>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   Full Page Export
   ────────────────────────────────────────────── */
export default function DonatePage() {
  return (
    <>
      <DonateHero />
      <ImpactStatement />
      <ThreePillars />
      <FullDonationBanner />
      <DonationFunds />
      <DonatePayment />
      <ThankYou />
    </>
  );
}
