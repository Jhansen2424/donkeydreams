"use client";

import { useState } from "react";

const presetAmounts = [25, 50, 100, 250];

export default function DonationWidget() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(50);
  const [customAmount, setCustomAmount] = useState("");
  const [isMonthly, setIsMonthly] = useState(false);
  const [loading, setLoading] = useState(false);

  const activeAmount = customAmount ? parseInt(customAmount) : selectedAmount;

  const handleDonate = async () => {
    if (!activeAmount || activeAmount < 1) return;
    setLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: activeAmount,
          recurring: isMonthly,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="donate" className="py-24 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-terra font-semibold tracking-widest uppercase text-sm mb-3">
              Make a Difference
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-charcoal mb-4">
              Help Us Care for{" "}
              <span className="text-terra">Every Donkey</span>
            </h2>
            <p className="text-warm-gray text-lg">
              Your donation directly funds food, veterinary care, shelter, and
              the daily needs of our rescued donkeys.
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-lg border border-sand/10 p-8 sm:p-10">
            {/* Monthly / One-time toggle */}
            <div className="flex bg-cream-dark rounded-full p-1 mb-8 max-w-xs mx-auto">
              <button
                onClick={() => setIsMonthly(false)}
                className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  !isMonthly
                    ? "bg-white text-charcoal shadow-sm"
                    : "text-warm-gray"
                }`}
              >
                One-Time
              </button>
              <button
                onClick={() => setIsMonthly(true)}
                className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  isMonthly
                    ? "bg-white text-charcoal shadow-sm"
                    : "text-warm-gray"
                }`}
              >
                Monthly
              </button>
            </div>

            {/* Preset amounts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {presetAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => {
                    setSelectedAmount(amount);
                    setCustomAmount("");
                  }}
                  className={`py-4 rounded-xl text-lg font-bold transition-all border-2 ${
                    selectedAmount === amount && !customAmount
                      ? "border-terra bg-terra/5 text-terra"
                      : "border-sand/20 text-charcoal hover:border-sand"
                  }`}
                >
                  ${amount}
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div className="relative mb-8">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-gray text-lg font-medium">
                $
              </span>
              <input
                type="number"
                placeholder="Custom amount"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedAmount(null);
                }}
                className="w-full pl-8 pr-4 py-4 rounded-xl border-2 border-sand/20 focus:border-terra focus:outline-none text-lg text-charcoal placeholder:text-warm-gray/50 bg-cream/50"
                min="1"
              />
            </div>

            {/* Donate button */}
            <button
              onClick={handleDonate}
              disabled={!activeAmount || activeAmount < 1 || loading}
              className="w-full bg-terra hover:bg-terra-dark disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-full text-lg font-bold transition-all hover:scale-[1.02] shadow-lg"
            >
              {loading
                ? "Processing..."
                : `Donate ${activeAmount ? `$${activeAmount}` : ""}${isMonthly ? " / month" : ""}`}
            </button>

            {/* Trust signals */}
            <div className="flex items-center justify-center gap-6 mt-6 text-warm-gray/60 text-xs">
              <span className="flex items-center gap-1">
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
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Secure Payment
              </span>
              <span>501(c)(3) Tax Deductible</span>
              <span>100% Goes to Care</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
