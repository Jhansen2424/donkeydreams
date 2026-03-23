"use client";

import { useState } from "react";

const faqs = [
  {
    question: "What can I expect during a Virtual Visit?",
    answer:
      "For 30 minutes, you will get to join us live as we meander the hillsides at our sanctuary, giving the herd love in peace and joy with their herd families. You might get to see a herd run or some baby donkeys! Every experience is unique.",
  },
  {
    question: "How much time in advance should I schedule my visit?",
    answer:
      "To ensure that a particular date is available, we recommend scheduling your visit 2 weeks in advance. If it has been only a few days or earlier within 1 week, we&apos;ll try our best to accommodate. Please fill out the form below to request your preferred date and time.",
  },
  {
    question: "When is the best time to experience a Virtual Visit?",
    answer:
      "We recommend choosing a date sometime morning or early afternoon. Of course, this changes throughout the year.",
  },
  {
    question: "Can I request to visit with a specific donkey or herd?",
    answer: "Of course!",
  },
  {
    question: "How do I schedule my Virtual Visit?",
    answer:
      "Complete our Sign Up Form below, then make your donation. Please be sure to use the same name as on your form.",
  },
];

export default function VirtualVisitFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 bg-cream-dark" id="faq">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-charcoal text-center mb-12">
          Frequently Asked Questions
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="bg-white rounded-xl border border-cream-dark overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left gap-4 cursor-pointer"
                >
                  <span className="text-charcoal font-semibold text-lg leading-snug">
                    {faq.question}
                  </span>
                  <svg
                    className={`w-5 h-5 text-terra shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
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
                <div
                  className="overflow-hidden transition-all duration-300"
                  style={{
                    maxHeight: isOpen ? "300px" : "0px",
                    opacity: isOpen ? 1 : 0,
                  }}
                >
                  <p className="px-6 pb-5 text-warm-gray leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
