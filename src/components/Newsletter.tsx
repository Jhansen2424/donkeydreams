"use client";

import { useState } from "react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: integrate with Mailchimp/Resend
    setSubmitted(true);
  };

  return (
    <section className="relative py-24 bg-gradient-to-b from-cream via-sand/10 to-sand-dark overflow-hidden">
      {/* Blobs */}
      <div className="absolute top-10 -right-20 w-80 h-80 bg-sky/8 rounded-full blur-3xl" />
      <div className="absolute bottom-10 -left-20 w-60 h-60 bg-sand/15 rounded-full blur-3xl" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sky font-bold tracking-[0.15em] uppercase text-sm mb-4">
          Stay Connected
        </p>
        <h2 className="text-4xl sm:text-5xl font-extrabold text-charcoal mb-4">
          Stay in the Loop
        </h2>
        <p className="text-warm-gray text-xl mb-10">
          Get donkey updates, rescue stories, and sanctuary news delivered to
          your inbox.
        </p>

        {submitted ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-[2rem] p-8 border border-sky/20 shadow-[0_8px_40px_rgba(92,205,243,0.1)]">
            <p className="text-charcoal text-lg font-bold">
              Thank you for subscribing!
            </p>
            <p className="text-warm-gray text-sm mt-2">
              You&apos;ll hear from us soon with donkey updates.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-6 py-4 rounded-full bg-white border-2 border-sky/20 text-charcoal placeholder:text-warm-gray/50 focus:outline-none focus:border-sky shadow-[0_4px_20px_rgba(92,205,243,0.08)] text-sm"
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-sky to-sky-dark hover:from-sky-dark hover:to-sky text-white px-8 py-4 rounded-full font-bold transition-all duration-300 text-sm shadow-[0_4px_25px_rgba(92,205,243,0.3)]"
            >
              Subscribe
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
