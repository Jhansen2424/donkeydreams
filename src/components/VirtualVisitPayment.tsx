export default function VirtualVisitPayment() {
  return (
    <section className="py-20 bg-cream-dark">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-charcoal mb-10">
          Send Your Virtual Visit Donation
        </h2>

        <div className="space-y-8">
          {/* PayPal */}
          <div className="bg-white rounded-2xl p-8 shadow-md border border-cream-dark">
            <h3 className="text-xl font-bold text-charcoal mb-2">
              Pay Using PayPal
            </h3>
            <a
              href="https://www.paypal.com/donate/?hosted_button_id=PLACEHOLDER"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#0070ba] hover:bg-[#005ea6] text-white px-8 py-3 rounded-full font-semibold transition-all hover:scale-105 shadow-md mt-2"
            >
              Send Your Virtual Visit Donation Using PayPal
            </a>
          </div>

          {/* Venmo */}
          <div className="bg-white rounded-2xl p-8 shadow-md border border-cream-dark">
            <h3 className="text-xl font-bold text-charcoal mb-2">
              Pay Using Venmo
            </h3>
            <p className="text-warm-gray">
              Find us at{" "}
              <span className="text-terra font-semibold">
                @DonkeyDreamsSanctuary
              </span>
            </p>
          </div>

          {/* Check */}
          <div className="bg-white rounded-2xl p-8 shadow-md border border-cream-dark">
            <h3 className="text-xl font-bold text-charcoal mb-2">
              Send a Check
            </h3>
            <div className="text-warm-gray leading-relaxed">
              <p className="font-semibold text-charcoal">Donkey Dreams</p>
              <p>Virtual Visit Donation</p>
              <p>PO Box 607</p>
              <p>Littlefield, AZ 86432</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
