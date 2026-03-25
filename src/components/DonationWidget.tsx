export default function DonationWidget() {
  return (
    <section id="donate" className="relative py-28 bg-gradient-to-b from-cream via-sand/5 to-white overflow-hidden">
      {/* Blobs */}
      <div className="absolute top-20 -left-32 w-96 h-96 bg-sky/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 -right-32 w-80 h-80 bg-terra/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-sky font-bold tracking-[0.15em] uppercase text-sm mb-4">
              Make a Difference
            </p>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-charcoal mb-4">
              Help Us Care for{" "}
              <span className="text-sky">Every Donkey</span>
            </h2>
            <p className="text-warm-gray text-lg">
              Your donation directly funds food, veterinary care, shelter, and
              the daily needs of our rescued donkeys.
            </p>
          </div>

          <div className="bg-white rounded-[2rem] shadow-[0_8px_40px_rgba(68,98,162,0.08)] border border-sky/10 p-8 sm:p-10">
            {/* Primary — Zeffy */}
            <div className="text-center mb-8">
              <p className="text-terra font-semibold tracking-widest uppercase text-xs mb-2">
                Recommended
              </p>
              <p className="text-warm-gray text-sm mb-5">
                Zeffy is 100% free for nonprofits — every dollar goes to our
                donkeys.
              </p>
              <a
                href="https://www.zeffy.com/PLACEHOLDER"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-gradient-to-r from-sky to-sky-dark hover:from-sky-dark hover:to-sky text-white px-10 py-4 rounded-full text-lg font-bold transition-all duration-300 shadow-[0_4px_25px_rgba(92,205,243,0.3)] hover:shadow-[0_8px_40px_rgba(92,205,243,0.4)]"
              >
                Donate via Zeffy
              </a>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex-1 border-t border-sand/30" />
              <span className="text-warm-gray/60 text-xs font-medium">
                Other Ways to Give
              </span>
              <div className="flex-1 border-t border-sand/30" />
            </div>

            {/* Secondary methods — compact grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* PayPal */}
              <a
                href="https://www.paypal.com/donate/?hosted_button_id=PLACEHOLDER"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-sand/20 hover:border-sky/40 hover:bg-sky/5 transition-all group"
              >
                <svg className="w-6 h-6 text-warm-gray group-hover:text-[#0070ba] transition-colors" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944 2.9A.859.859 0 015.79 2.2h6.15c2.04 0 3.66.53 4.6 1.55.44.48.73 1.02.87 1.62.15.63.14 1.38-.03 2.25v.62l.45.26c.38.2.68.43.92.7.34.39.56.87.65 1.42.09.57.06 1.24-.09 1.99-.18.86-.47 1.62-.88 2.26-.37.58-.84 1.07-1.39 1.45-.52.36-1.13.63-1.81.8-.66.17-1.4.25-2.2.25h-.52a1.3 1.3 0 00-1.28 1.1l-.04.2-.64 4.07-.03.15a.16.16 0 01-.16.13H7.076z" />
                </svg>
                <span className="text-xs font-semibold text-warm-gray group-hover:text-charcoal transition-colors">
                  PayPal
                </span>
              </a>

              {/* Venmo */}
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-sand/20 group relative">
                <svg className="w-6 h-6 text-warm-gray" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.755 3.22a4.91 4.91 0 01.84 2.75c0 3.42-2.93 7.87-5.3 10.99H9.66L7.41 3.87l4.75-.45 1.2 9.63c1.12-1.82 2.5-4.69 2.5-6.66 0-1.04-.18-1.76-.5-2.33l4.39-.84z" />
                </svg>
                <span className="text-xs font-semibold text-warm-gray">
                  Venmo
                </span>
                <span className="text-[10px] text-terra font-medium">
                  @DonkeyDreamsSanctuary
                </span>
              </div>

              {/* Zelle */}
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-sand/20 group">
                <svg className="w-6 h-6 text-warm-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                </svg>
                <span className="text-xs font-semibold text-warm-gray">
                  Zelle
                </span>
                <span className="text-[10px] text-terra font-medium break-all text-center leading-tight">
                  donkeydreamssanctuary
                  <br />
                  @gmail.com
                </span>
              </div>

              {/* Mail */}
              <a
                href="/donate#donate-now"
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-sand/20 hover:border-sky/40 hover:bg-sky/5 transition-all group"
              >
                <svg className="w-6 h-6 text-warm-gray group-hover:text-sky transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <span className="text-xs font-semibold text-warm-gray group-hover:text-charcoal transition-colors">
                  Mail a Check
                </span>
              </a>
            </div>

            {/* Trust signals */}
            <div className="flex items-center justify-center gap-6 mt-8 text-warm-gray/60 text-xs">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
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
