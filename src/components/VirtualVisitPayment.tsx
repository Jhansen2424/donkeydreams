"use client";

import { useState } from "react";

const methods = [
  {
    id: "zeffy",
    label: "Zeffy",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
  },
  {
    id: "paypal",
    label: "PayPal",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944 2.9A.859.859 0 015.79 2.2h6.15c2.04 0 3.66.53 4.6 1.55.44.48.73 1.02.87 1.62.15.63.14 1.38-.03 2.25v.62l.45.26c.38.2.68.43.92.7.34.39.56.87.65 1.42.09.57.06 1.24-.09 1.99-.18.86-.47 1.62-.88 2.26-.37.58-.84 1.07-1.39 1.45-.52.36-1.13.63-1.81.8-.66.17-1.4.25-2.2.25h-.52a1.3 1.3 0 00-1.28 1.1l-.04.2-.64 4.07-.03.15a.16.16 0 01-.16.13H7.076z" />
      </svg>
    ),
  },
  {
    id: "venmo",
    label: "Venmo",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.755 3.22a4.91 4.91 0 01.84 2.75c0 3.42-2.93 7.87-5.3 10.99H9.66L7.41 3.87l4.75-.45 1.2 9.63c1.12-1.82 2.5-4.69 2.5-6.66 0-1.04-.18-1.76-.5-2.33l4.39-.84z" />
      </svg>
    ),
  },
  {
    id: "zelle",
    label: "Zelle",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
  },
  {
    id: "mail",
    label: "Mail",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    ),
  },
] as const;

type MethodId = (typeof methods)[number]["id"];

const tabContent: Record<MethodId, React.ReactNode> = {
  zeffy: (
    <div>
      <p className="text-warm-gray mb-5">
        Zeffy is a 100% free donation platform — every dollar goes directly to
        our donkeys.
      </p>
      <a
        href="https://www.zeffy.com/PLACEHOLDER"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block bg-terra hover:bg-terra-dark text-white px-8 py-3 rounded-full font-semibold transition-all hover:scale-105 shadow-md"
      >
        Donate via Zeffy
      </a>
    </div>
  ),
  paypal: (
    <div>
      <p className="text-warm-gray mb-5">
        Send your virtual visit donation securely through PayPal.
      </p>
      <a
        href="https://www.paypal.com/donate/?hosted_button_id=PLACEHOLDER"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block bg-[#0070ba] hover:bg-[#005ea6] text-white px-8 py-3 rounded-full font-semibold transition-all hover:scale-105 shadow-md"
      >
        Donate via PayPal
      </a>
    </div>
  ),
  venmo: (
    <div>
      <p className="text-warm-gray mb-2">Find us on Venmo at</p>
      <p className="text-terra font-semibold text-lg">
        @DonkeyDreamsSanctuary
      </p>
    </div>
  ),
  zelle: (
    <div>
      <p className="text-warm-gray mb-2">Send your donation via Zelle to</p>
      <p className="text-terra font-semibold text-lg">
        donkeydreamssanctuary@gmail.com
      </p>
    </div>
  ),
  mail: (
    <div className="text-warm-gray leading-relaxed">
      <p className="mb-2">Make your check payable to:</p>
      <p className="font-semibold text-charcoal">Donkey Dreams</p>
      <p>Virtual Visit Donation</p>
      <p>PO Box 607</p>
      <p>Littlefield, AZ 86432</p>
    </div>
  ),
};

export default function VirtualVisitPayment() {
  const [active, setActive] = useState<MethodId>("zeffy");

  return (
    <section className="py-20 bg-cream-dark">
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-charcoal mb-8">
          Send Your Virtual Visit Donation
        </h2>

        <div className="bg-white rounded-2xl shadow-md border border-cream-dark overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-cream-dark">
            {methods.map((m) => (
              <button
                key={m.id}
                onClick={() => setActive(m.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-4 text-xs font-semibold transition-all relative ${
                  active === m.id
                    ? "text-terra"
                    : "text-warm-gray hover:text-charcoal"
                }`}
              >
                {m.icon}
                <span>{m.label}</span>
                {active === m.id && (
                  <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-terra rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-8">{tabContent[active]}</div>
        </div>
      </div>
    </section>
  );
}
