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
    <section className="py-20 bg-sand-dark">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-3">
          Stay in the Loop
        </h2>
        <p className="text-white/70 text-lg mb-8">
          Get donkey updates, rescue stories, and sanctuary news delivered to
          your inbox.
        </p>

        {submitted ? (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <p className="text-white text-lg font-medium">
              Thank you for subscribing! 🎉
            </p>
            <p className="text-white/60 text-sm mt-2">
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
              className="flex-1 px-6 py-4 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-white/50 text-sm"
            />
            <button
              type="submit"
              className="bg-white text-sand-dark hover:bg-cream px-8 py-4 rounded-full font-semibold transition-colors text-sm"
            >
              Subscribe
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
