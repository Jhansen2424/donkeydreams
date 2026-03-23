"use client";

import { useState } from "react";

const videoApps = ["Zoom", "Skype", "Google Duo", "Facetime", "WhatsApp"];

export default function VirtualVisitForm() {
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  function toggleApp(app: string) {
    setSelectedApps((prev) =>
      prev.includes(app) ? prev.filter((a) => a !== app) : [...prev, app]
    );
  }

  function handleSelectAll() {
    if (selectAll) {
      setSelectedApps([]);
      setSelectAll(false);
    } else {
      setSelectedApps([...videoApps]);
      setSelectAll(true);
    }
  }

  return (
    <section className="py-20 bg-cream" id="book">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-charcoal text-center mb-4">
          Virtual Visits Sign Up Form
        </h2>
        <p className="text-warm-gray text-center mb-10">
          Please note: Our Visits are conducted in English only. (Please
          acknowledge with a &quot;Yes&quot;)
        </p>

        <form className="space-y-8 bg-white rounded-2xl p-6 sm:p-10 shadow-md border border-cream-dark">
          {/* Name */}
          <div>
            <label className="block text-charcoal font-semibold mb-1">
              Name <span className="text-terra">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="First"
                required
                className="w-full border border-cream-dark rounded-lg px-4 py-3 text-charcoal focus:outline-none focus:ring-2 focus:ring-terra/40"
              />
              <input
                type="text"
                placeholder="Last"
                required
                className="w-full border border-cream-dark rounded-lg px-4 py-3 text-charcoal focus:outline-none focus:ring-2 focus:ring-terra/40"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-charcoal font-semibold mb-1">
              Email <span className="text-terra">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="email"
                placeholder="Enter Email"
                required
                className="w-full border border-cream-dark rounded-lg px-4 py-3 text-charcoal focus:outline-none focus:ring-2 focus:ring-terra/40"
              />
              <input
                type="email"
                placeholder="Confirm Email"
                required
                className="w-full border border-cream-dark rounded-lg px-4 py-3 text-charcoal focus:outline-none focus:ring-2 focus:ring-terra/40"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-charcoal font-semibold mb-1">
              Phone
            </label>
            <input
              type="tel"
              placeholder="Phone number"
              className="w-full border border-cream-dark rounded-lg px-4 py-3 text-charcoal focus:outline-none focus:ring-2 focus:ring-terra/40"
            />
          </div>

          {/* Video Apps */}
          <div>
            <label className="block text-charcoal font-semibold mb-1">
              What video streaming apps are you able to use for your visit?{" "}
              <span className="text-terra">*</span>
            </label>
            <p className="text-warm-gray text-sm mb-3">
              (Check all that apply.)
            </p>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="w-4 h-4 accent-terra"
                />
                <span className="text-charcoal">Select All</span>
              </label>
              {videoApps.map((app) => (
                <label key={app} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedApps.includes(app)}
                    onChange={() => toggleApp(app)}
                    className="w-4 h-4 accent-terra"
                  />
                  <span className="text-charcoal">{app}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Preferred App */}
          <div>
            <label className="block text-charcoal font-semibold mb-1">
              What is your preferred app to use?
            </label>
            <input
              type="text"
              placeholder="Preferred app"
              className="w-full border border-cream-dark rounded-lg px-4 py-3 text-charcoal focus:outline-none focus:ring-2 focus:ring-terra/40"
            />
          </div>

          {/* Scheduling */}
          <div className="border-t border-cream-dark pt-8">
            <h3 className="text-2xl font-bold text-charcoal text-center mb-2">
              Scheduling Your Visit
            </h3>
            <p className="text-warm-gray text-center mb-6">
              We will do our best to go with your primary choice.
            </p>

            {/* Primary Choice */}
            <div className="mb-6">
              <label className="block text-charcoal font-semibold mb-1">
                Primary Choice <span className="text-terra">*</span>
              </label>
              <p className="text-warm-gray text-sm mb-2">
                Please provide a Primary Choice date (MM/DD/YYYY) and time
                (include your timezone). Please note that we are PST (timezone
                in Arizona, U.S.)
              </p>
              <input
                type="text"
                placeholder="MM/DD/YYYY, Time, Timezone"
                required
                className="w-full border border-cream-dark rounded-lg px-4 py-3 text-charcoal focus:outline-none focus:ring-2 focus:ring-terra/40"
              />
            </div>

            {/* Secondary Choice */}
            <div className="mb-6">
              <label className="block text-charcoal font-semibold mb-1">
                Secondary Choice <span className="text-terra">*</span>
              </label>
              <p className="text-warm-gray text-sm mb-2">
                Please provide a Secondary Choice date (MM/DD/YYYY) and time
                (include your timezone). Please note that we are PST (timezone
                in Arizona, U.S.)
              </p>
              <input
                type="text"
                placeholder="MM/DD/YYYY, Time, Timezone"
                required
                className="w-full border border-cream-dark rounded-lg px-4 py-3 text-charcoal focus:outline-none focus:ring-2 focus:ring-terra/40"
              />
            </div>

            {/* Donkey Request */}
            <div className="mb-6">
              <label className="block text-charcoal font-semibold mb-1">
                (Optional) Is there a specific family or donkey that you would
                like to request to be in your Virtual Visit?
              </label>
              <textarea
                placeholder="List names below"
                rows={3}
                maxLength={600}
                className="w-full border border-cream-dark rounded-lg px-4 py-3 text-charcoal focus:outline-none focus:ring-2 focus:ring-terra/40 resize-none"
              />
              <p className="text-warm-gray/60 text-xs mt-1 text-right">
                0 of 600 max characters
              </p>
            </div>

            {/* Additional Info */}
            <div className="mb-6">
              <label className="block text-charcoal font-semibold mb-1">
                Additional Information
              </label>
              <p className="text-warm-gray text-sm mb-2">
                Is there anything that we should know? i.e. special occasion,
                someone&apos;s birthday? Any children participating?
              </p>
              <textarea
                rows={3}
                maxLength={600}
                className="w-full border border-cream-dark rounded-lg px-4 py-3 text-charcoal focus:outline-none focus:ring-2 focus:ring-terra/40 resize-none"
              />
              <p className="text-warm-gray/60 text-xs mt-1 text-right">
                0 of 600 max characters
              </p>
            </div>
          </div>

          {/* Send Donation */}
          <div className="border-t border-cream-dark pt-8">
            <h3 className="text-xl font-bold text-charcoal mb-2">
              Send Donation <span className="text-terra">*</span>
            </h3>
            <p className="text-warm-gray text-sm mb-4">
              Make your donation (See blue button below this form.) Your
              visit&apos;s day and time will be confirmed after we have received
              your donation.
            </p>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                required
                className="w-4 h-4 accent-terra mt-1"
              />
              <span className="text-charcoal text-sm">
                I have sent my donation to Donkey Dreams using the same name as
                shown on this form.
              </span>
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-terra hover:bg-terra-dark text-white py-4 rounded-full text-lg font-semibold transition-all hover:scale-[1.02] shadow-lg cursor-pointer"
          >
            Submit
          </button>
        </form>
      </div>
    </section>
  );
}
