import type { Metadata } from "next";
import HowToHelpHero from "@/components/HowToHelpHero";
import PhotoScrollGallery from "@/components/PhotoScrollGallery";

export const metadata: Metadata = {
  title: "How To Help | Donkey Dreams Sanctuary",
  description:
    "Support the rescued donkeys of Donkey Dreams Sanctuary. Donate, sponsor a donkey, volunteer, or plan a visit to our Scenic, AZ sanctuary.",
};

export default function HowToHelpPage() {
  return (
    <>
      <HowToHelpHero />

      {/* Personal message from founders */}
      <section className="py-24 bg-cream">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sand font-semibold tracking-widest uppercase text-sm mb-3">
              A Note from Amber &amp; Edj
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-charcoal">
              Make a Difference
            </h2>
          </div>

          {/* Letter-style card */}
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-sand/10 relative">
            {/* Decorative quote mark */}
            <div className="absolute -top-5 left-8 sm:left-12 text-6xl text-sand/30 font-serif leading-none select-none">
              &ldquo;
            </div>

            <p className="text-warm-gray text-lg leading-relaxed mb-6">
              Since we recently adopted a number of donkeys, we would like to give
              our new donkey residents time to settle in before welcoming our
              friends and family. If you would like to be invited to private donkey
              experiences hosted by us,{" "}
              <strong className="text-charcoal">
                join our friends and family community
              </strong>{" "}
              so you can receive personal email invitations from Amber and Edj.
            </p>

            <p className="text-warm-gray text-lg leading-relaxed mb-8">
              In the meantime, the best way to support the herd is through a
              donation or sponsorship. Every dollar goes directly to food,
              veterinary care, and shelter for our donkeys.
            </p>

            <p className="text-charcoal font-semibold text-lg mb-1">
              With love,
            </p>
            <p className="text-warm-gray italic">
              Amber, Edj &amp; the whole herd 🫏
            </p>
          </div>

          {/* Two big CTA cards */}
          <div className="grid sm:grid-cols-2 gap-6 mt-12">
            {/* Donate */}
            <a
              href="/donate"
              className="group relative bg-terra rounded-2xl p-8 sm:p-10 text-white overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <div className="absolute top-4 right-4 opacity-10 text-8xl leading-none select-none group-hover:scale-110 transition-transform">
                💛
              </div>
              <h3 className="text-2xl font-bold mb-3 relative z-10">Donate</h3>
              <p className="text-white/80 text-sm leading-relaxed mb-6 relative z-10">
                A one-time or recurring gift that directly funds food, shelter,
                and veterinary care for 50+ donkeys.
              </p>
              <span className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-full text-sm font-semibold transition-colors relative z-10">
                Give Now
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </span>
            </a>

            {/* Sponsor */}
            <a
              href="/donkeys"
              className="group relative bg-sky rounded-2xl p-8 sm:p-10 text-white overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <div className="absolute top-4 right-4 opacity-10 text-8xl leading-none select-none group-hover:scale-110 transition-transform">
                🫏
              </div>
              <h3 className="text-2xl font-bold mb-3 relative z-10">Sponsor a Donkey</h3>
              <p className="text-white/80 text-sm leading-relaxed mb-6 relative z-10">
                Choose a donkey to sponsor monthly. Get updates, photos, and
                the joy of knowing your donkey by name.
              </p>
              <span className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-full text-sm font-semibold transition-colors relative z-10">
                Meet the Herd
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* Your Dollar Does This — spotlight cards */}
      <section className="py-20 bg-cream-dark">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sand font-semibold tracking-widest uppercase text-sm mb-3">
              Where Your Money Goes
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-charcoal">
              Every Dollar Has a Job
            </h2>
          </div>

          {/* Tier cards */}
          <div className="grid sm:grid-cols-3 gap-6 mb-12">
            {[
              {
                amount: "$20",
                emoji: "🌾",
                label: "A Bale of Hay",
                description:
                  "Keeps a donkey fed and happy for days. Hay is the foundation of every donkey's diet.",
                bg: "bg-sand/10",
                border: "border-sand/20",
                accent: "text-sand-dark",
              },
              {
                amount: "$40",
                emoji: "🫏",
                label: "A Hoof Trimming",
                description:
                  "Donkeys need regular hoof care to stay healthy and comfortable. This covers one full trim.",
                bg: "bg-terra/5",
                border: "border-terra/15",
                accent: "text-terra",
              },
              {
                amount: "$100",
                emoji: "🩺",
                label: "An Annual Vet Check-Up",
                description:
                  "A full veterinary exam including dental, deworming, and vaccinations for one donkey.",
                bg: "bg-sage/10",
                border: "border-sage/20",
                accent: "text-sage",
              },
            ].map((tier) => (
              <div
                key={tier.amount}
                className={`${tier.bg} border ${tier.border} rounded-2xl p-8 text-center hover:shadow-md transition-shadow`}
              >
                <span className="text-5xl mb-4 block">{tier.emoji}</span>
                <p className={`text-4xl font-bold ${tier.accent} mb-1`}>
                  {tier.amount}
                </p>
                <p className="text-charcoal font-bold text-lg mb-3">
                  {tier.label}
                </p>
                <p className="text-warm-gray text-sm leading-relaxed">
                  {tier.description}
                </p>
              </div>
            ))}
          </div>

          {/* Lifetime sanctuary message */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-warm-gray text-base leading-relaxed">
              Since we are a lifetime sanctuary, we are financially responsible
              for the care of our donkeys for their entire life — which can be up
              to <strong className="text-charcoal">50 years</strong>. Whether
              it&apos;s $20 for a bale of hay or a monthly sponsorship, every
              contribution matters.
            </p>
          </div>

          {/* Donate button + mail option */}
          <div className="text-center">
            <a
              href="/donate"
              className="inline-block bg-terra hover:bg-terra-dark text-white px-10 py-4 rounded-full text-lg font-semibold transition-colors shadow-lg"
            >
              Donate Today
            </a>
            <div className="mt-6 text-warm-gray/60 text-sm">
              <p className="font-medium text-warm-gray/80 mb-1">
                Prefer to send a check?
              </p>
              <p>
                Donkey Dreams &middot; PO Box 951 &middot; Littlefield, AZ 86432
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Photo gallery — infinite scroll */}
      <PhotoScrollGallery />

      {/* Sponsor a Donkey — DonkeyGram style tier cards */}
      <section className="py-24 bg-cream-dark">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <p className="text-sand font-semibold tracking-widest uppercase text-sm mb-3">
              Monthly Sponsorship
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-charcoal">
              Sponsor a Donkey
            </h2>
          </div>
          <p className="text-warm-gray text-base text-center max-w-2xl mx-auto mb-4">
            Many people would love to have their own donkey but don&apos;t have
            the space for it — so they sponsor one at Donkey Dreams. As a
            sponsor, you&apos;ll receive monthly updates on your donkey and
            personal invitations from Amber and Edj to come hang with your
            sponsored donkey.
          </p>
          <p className="text-warm-gray/60 text-sm text-center max-w-xl mx-auto mb-14">
            Once you&apos;ve selected your sponsorship level, you&apos;ll
            receive an email from{" "}
            <span className="text-charcoal font-medium">
              amber@donkeydreams.org
            </span>{" "}
            asking which donkey you&apos;d like to sponsor.
          </p>

          {/* Tier cards — DonkeyGram profile style */}
          <div className="grid sm:grid-cols-3 gap-6 mb-12">
            {[
              {
                tier: "Silver",
                price: "$60",
                color: "bg-gradient-to-br from-gray-300 to-gray-400",
                ring: "ring-gray-300",
                accent: "text-gray-500",
                perks: [
                  "Feed your donkey & provide essential minerals for one month",
                ],
              },
              {
                tier: "Gold",
                price: "$90",
                color: "bg-gradient-to-br from-amber-300 to-amber-500",
                ring: "ring-amber-300",
                accent: "text-amber-600",
                popular: true,
                perks: [
                  "Feed your donkey & provide essential minerals for one month",
                  "Help with hoof trimming",
                  "Provides toys for mental stimulation",
                ],
              },
              {
                tier: "Platinum",
                price: "$125",
                color: "bg-gradient-to-br from-sky to-sky/70",
                ring: "ring-sky",
                accent: "text-sky",
                perks: [
                  "Feed your donkey & provide essential minerals for one month",
                  "Help with hoof trimming",
                  "Cover de-worming & annual vaccinations",
                  "Provides toys for mental stimulation",
                ],
              },
            ].map((plan) => (
              <div
                key={plan.tier}
                className={`relative bg-white rounded-2xl overflow-hidden shadow-sm border border-sand/10 hover:shadow-lg transition-all flex flex-col ${
                  plan.popular ? "sm:-translate-y-2 shadow-md" : ""
                }`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-terra text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl">
                    Most Popular
                  </div>
                )}

                {/* Profile header */}
                <div className="p-6 pb-4 text-center">
                  {/* Avatar circle with tier gradient */}
                  <div
                    className={`w-20 h-20 rounded-full ${plan.color} mx-auto mb-3 flex items-center justify-center ring-4 ${plan.ring} ring-offset-2 ring-offset-white`}
                  >
                    <span className="text-3xl">🫏</span>
                  </div>
                  <h3 className="text-xl font-bold text-charcoal">
                    {plan.tier}
                  </h3>
                  <div className="mt-2">
                    <span className={`text-3xl font-bold ${plan.accent}`}>
                      {plan.price}
                    </span>
                    <span className="text-warm-gray text-sm">/month</span>
                  </div>
                </div>

                {/* Perks list — styled like a bio/about section */}
                <div className="px-6 pb-4 flex-1">
                  <div className="border-t border-sand/15 pt-4 space-y-2.5">
                    {plan.perks.map((perk, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <svg
                          className={`w-4 h-4 ${plan.accent} flex-shrink-0 mt-0.5`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-warm-gray text-sm leading-snug">
                          {perk}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sponsor button — styled like "Follow" */}
                <div className="px-6 pb-6">
                  <a
                    href="/donate"
                    className={`block w-full py-3 rounded-full text-center text-sm font-semibold transition-colors ${
                      plan.popular
                        ? "bg-terra hover:bg-terra-dark text-white"
                        : "bg-charcoal/5 hover:bg-charcoal/10 text-charcoal"
                    }`}
                  >
                    Sponsor a Donkey
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* General fund fallback */}
          <div className="text-center">
            <p className="text-warm-gray text-sm mb-3">
              Don&apos;t see a package that works for you?
            </p>
            <a
              href="/donate"
              className="inline-flex items-center gap-2 text-terra font-semibold text-sm hover:underline"
            >
              Contribute to the general sponsorship fund
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* More ways to help */}
      <section className="py-20 bg-cream-dark">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sand font-semibold tracking-widest uppercase text-sm mb-3">
              Beyond Donations
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-charcoal">
              Other Ways to Help
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: "🤝",
                title: "Volunteer",
                description:
                  "Spend a day feeding, grooming, and caring for the donkeys.",
              },
              {
                icon: "📣",
                title: "Spread the Word",
                description:
                  "Share our mission on social media or tell a friend. Awareness saves donkeys.",
              },
              {
                icon: "🏠",
                title: "Visit Us",
                description:
                  "Meet the herd in person in Scenic, AZ. Private tours available by invitation.",
              },
              {
                icon: "🎁",
                title: "Gift a Sponsorship",
                description:
                  "The perfect gift for the animal lover in your life — birthdays, holidays, or just because.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-2xl p-6 shadow-sm border border-sand/10 text-center hover:shadow-md transition-shadow"
              >
                <span className="text-3xl mb-3 block">{item.icon}</span>
                <h3 className="text-lg font-bold text-charcoal mb-2">
                  {item.title}
                </h3>
                <p className="text-warm-gray text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* The Herd Wants You — social feed style */}
      <section className="py-20 bg-cream">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          {/* Notification header */}
          <div className="text-center mb-8">
            <p className="text-sand font-semibold tracking-widest uppercase text-sm mb-3">
              You&apos;re Invited
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-charcoal">
              The Herd Wants You
            </h2>
          </div>

          {/* Social card — looks like a group invite */}
          <div className="bg-white rounded-3xl shadow-md border border-sand/10 overflow-hidden">
            {/* Top bar — like an app notification */}
            <div className="bg-charcoal px-6 py-3 flex items-center gap-3">
              <div className="flex -space-x-2">
                <div className="w-7 h-7 rounded-full bg-terra/80 flex items-center justify-center text-[10px] text-white font-bold ring-2 ring-charcoal">P</div>
                <div className="w-7 h-7 rounded-full bg-sky/80 flex items-center justify-center text-[10px] text-white font-bold ring-2 ring-charcoal">E</div>
                <div className="w-7 h-7 rounded-full bg-sage/80 flex items-center justify-center text-[10px] text-white font-bold ring-2 ring-charcoal">D</div>
                <div className="w-7 h-7 rounded-full bg-sand/80 flex items-center justify-center text-[10px] text-white font-bold ring-2 ring-charcoal">R</div>
              </div>
              <p className="text-white/80 text-xs font-medium">
                <span className="text-white font-bold">Pink</span> invited you to join{" "}
                <span className="text-sand-light font-bold">Friends &amp; Family</span>
              </p>
            </div>

            {/* Fake notification previews */}
            <div className="p-5 space-y-3">
              {[
                { icon: "🚨", label: "New Rescue Alert", text: "Meet our newest arrival — story dropping soon!", time: "2h ago" },
                { icon: "🫏", label: "Private Tour", text: "You're invited to a private donkey experience this Saturday", time: "1d ago" },
                { icon: "📸", label: "First Look", text: "Exclusive photos of the new babies before anyone else", time: "3d ago" },
              ].map((notif) => (
                <div
                  key={notif.label}
                  className="flex items-start gap-3 p-3 rounded-xl bg-cream/60 border border-sand/10"
                >
                  <span className="text-lg flex-shrink-0 mt-0.5">{notif.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-charcoal text-sm font-bold">{notif.label}</p>
                      <span className="text-warm-gray/50 text-[10px] flex-shrink-0">{notif.time}</span>
                    </div>
                    <p className="text-warm-gray text-xs leading-relaxed">{notif.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Email signup */}
            <div className="px-5 pb-6">
              <div className="bg-cream rounded-2xl p-5">
                <p className="text-charcoal text-sm font-semibold mb-1">
                  Join the inner circle
                </p>
                <p className="text-warm-gray text-xs mb-4">
                  Get personal invitations from Amber &amp; Edj for private donkey experiences and sanctuary updates.
                </p>
                <form action="#" className="flex gap-2">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    className="flex-1 bg-white border border-sand/20 rounded-full px-4 py-2.5 text-sm text-charcoal placeholder:text-warm-gray/40 focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra/40"
                  />
                  <button
                    type="submit"
                    className="bg-charcoal hover:bg-charcoal/80 text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-colors flex-shrink-0 cursor-pointer"
                  >
                    Join
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Trust note */}
          <p className="text-center text-warm-gray/50 text-xs mt-4">
            No spam, ever. Just donkey love from Scenic, AZ.
          </p>
        </div>
      </section>

      {/* Impact numbers */}
      <section className="py-20 bg-cream-dark">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-charcoal mb-12">
            Your Impact in Numbers
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: "50+", label: "Donkeys Rescued" },
              { number: "$25", label: "Feeds a Donkey for a Week" },
              { number: "100%", label: "Goes to Donkey Care" },
              { number: "365", label: "Days of Love a Year" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-4xl sm:text-5xl font-bold text-terra mb-2">
                  {stat.number}
                </p>
                <p className="text-warm-gray text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-charcoal">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto">
            It only takes a moment to change a donkey&apos;s life. Pick the way
            that feels right for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/donate"
              className="bg-terra hover:bg-terra-dark text-white px-10 py-4 rounded-full text-lg font-semibold transition-colors shadow-lg"
            >
              Donate Now
            </a>
            <a
              href="/donkeys"
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-10 py-4 rounded-full text-lg font-semibold transition-all"
            >
              Sponsor a Donkey
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
