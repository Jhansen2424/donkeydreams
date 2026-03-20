import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Hay Supper Club | Donkey Dreams Sanctuary",
  description:
    "Help us keep the hay barn full and donkey bellies happy! Join the Hay Supper Club and contribute monthly to build a hay reserve for the herd.",
};

export default function HaySupperClubPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-cream pt-28 sm:pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Image — left */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
              <Image
                src="/hay supper club.jpg"
                alt="Donkeys enjoying hay at the sanctuary"
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Text — right */}
            <div>
              <p className="text-sand font-semibold tracking-widest uppercase text-sm mb-4">
                How To Help
              </p>
              <h1 className="text-4xl sm:text-5xl font-bold text-charcoal mb-6">
                Hay Supper Club
              </h1>
              <p className="text-warm-gray text-lg sm:text-xl mb-10">
                Keep the hay barn full and burro bellies happy!
              </p>
              <a
                href="#join"
                className="inline-block bg-terra hover:bg-terra-dark text-white px-10 py-4 rounded-full text-lg font-semibold transition-colors shadow-lg"
              >
                Join the Hay Supper Club
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why Hay Matters */}
      <section className="py-24 bg-cream-dark">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sand font-semibold tracking-widest uppercase text-sm mb-3">
              The Key to Healthy Donkeys?
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-charcoal">
              It&apos;s in the Hay!
            </h2>
          </div>

          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-sand/10 space-y-6">
            <p className="text-warm-gray text-lg leading-relaxed">
              We&apos;re always striving to give our donkeys the healthiest,
              happiest lives possible. That means learning, listening to our
              veterinarians, and adjusting their care as needed.
            </p>

            <p className="text-warm-gray text-lg leading-relaxed">
              <strong className="text-charcoal">
                Hay is one of the most important and essential ongoing expenses
                in our budget.
              </strong>{" "}
              Investing in higher quality hay saves money on medical needs by
              keeping our donkeys healthier from the inside out.
            </p>

            <p className="text-warm-gray text-lg leading-relaxed">
              In the wild, donkeys are able to graze a variety of forage
              sources, giving them a balanced nutrition. They also get plenty of
              exercise, typically roaming up to 10 miles a day! At our
              sanctuary, we strive to give them a similar balanced diet and
              lifestyle.
            </p>

            <p className="text-warm-gray text-lg leading-relaxed">
              One important thing we&apos;ve learned is that donkeys are
              especially sensitive to sugars in their diet. In the wild, they
              eat very fibrous, low-sugar plants. In captivity, certain common
              feeds can cause weight gain, metabolic issues, and painful
              conditions like laminitis.
            </p>

            <p className="text-warm-gray text-lg leading-relaxed">
              That&apos;s why we&apos;ve been carefully reevaluating what we
              feed our donkeys to protect their health, prevent illness, and
              keep them comfortable for years to come.
            </p>
          </div>
        </div>
      </section>

      {/* Teff Hay Benefits */}
      <section className="py-20 bg-cream-dark">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sand font-semibold tracking-widest uppercase text-sm mb-3">
              Better Hay, Better Health
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-charcoal">
              Why We Switched to Teff
            </h2>
          </div>

          <p className="text-warm-gray text-lg text-center max-w-2xl mx-auto mb-12">
            Our food budget has increased to provide better quality hay called
            Teff, and we expect many healthier, long-term benefits, including:
          </p>

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                emoji: "💛",
                title: "Healthy Weight",
                description:
                  "Fewer donkeys struggling with weight gain",
              },
              {
                emoji: "💛",
                title: "Metabolic Health",
                description: "Lower risk of metabolic issues",
              },
              {
                emoji: "💛",
                title: "Stronger Hooves",
                description:
                  "Healthier hooves and less risk of painful laminitis",
              },
              {
                emoji: "💛",
                title: "Less Vet Visits",
                description:
                  "Fewer vet visits and less discomfort overall",
              },
            ].map((benefit) => (
              <div
                key={benefit.title}
                className="bg-white rounded-2xl p-6 shadow-sm border border-sand/10 flex items-start gap-4"
              >
                <span className="text-2xl flex-shrink-0">{benefit.emoji}</span>
                <div>
                  <h3 className="text-lg font-bold text-charcoal mb-1">
                    {benefit.title}
                  </h3>
                  <p className="text-warm-gray text-sm leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-warm-gray text-base text-center max-w-2xl mx-auto mt-10 leading-relaxed">
            We want our donkeys feeling better in their bodies and aging more
            gracefully. That means everything to us — and hopefully to you, our
            donkey-loving supporters, too!
          </p>
        </div>
      </section>

      {/* How It Works — The Hay Supper Club */}
      <section id="join" className="py-24 bg-cream">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sand font-semibold tracking-widest uppercase text-sm mb-3">
              Join the Hay Supper Club
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-charcoal mb-4">
              How It Works
            </h2>
            <p className="text-warm-gray text-lg max-w-2xl mx-auto">
              Contribute anywhere from $5 to $50 a month and help build a
              &ldquo;hay reserve.&rdquo; With enough members, we can eventually
              secure hay for an entire year at a much lower price.
            </p>
          </div>

          {/* Three step cards */}
          <div className="grid sm:grid-cols-3 gap-6 mb-14">
            {[
              {
                step: "01",
                emoji: "🎯",
                title: "The Goal",
                description:
                  "Build a savings for the next hay order or to purchase annually at a cheaper price.",
                bg: "bg-terra/5",
                border: "border-terra/15",
                accent: "text-terra",
              },
              {
                step: "02",
                emoji: "🤝",
                title: "How You Can Help",
                description:
                  "Contribute monthly — choose anywhere from $5 to $50.",
                bg: "bg-sky/5",
                border: "border-sky/15",
                accent: "text-sky",
              },
              {
                step: "03",
                emoji: "🌾",
                title: "The Result",
                description:
                  "Full hay barns, healthy, pain-free donkeys, and peace of mind!",
                bg: "bg-sage/10",
                border: "border-sage/20",
                accent: "text-sage",
              },
            ].map((item) => (
              <div
                key={item.step}
                className={`${item.bg} border ${item.border} rounded-2xl p-8 text-center hover:shadow-md transition-shadow`}
              >
                <p
                  className={`text-sm font-bold ${item.accent} tracking-widest uppercase mb-3`}
                >
                  Step {item.step}
                </p>
                <span className="text-4xl mb-4 block">{item.emoji}</span>
                <h3 className="text-xl font-bold text-charcoal mb-3">
                  {item.title}
                </h3>
                <p className="text-warm-gray text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <a
              href="/#donate"
              className="inline-block bg-terra hover:bg-terra-dark text-white px-10 py-4 rounded-full text-lg font-semibold transition-colors shadow-lg"
            >
              Join the Hay Supper Club
            </a>
            <p className="text-warm-gray/60 text-sm mt-4">
              Every dollar goes directly to feeding the herd.
            </p>
          </div>
        </div>
      </section>

      {/* Friends & Family Community */}
      <section className="py-20 bg-cream-dark">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <p className="text-sand font-semibold tracking-widest uppercase text-sm mb-3">
              Stay Connected
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-charcoal">
              Join Our Friends &amp; Family
            </h2>
          </div>

          <div className="bg-white rounded-3xl shadow-md border border-sand/10 overflow-hidden">
            <div className="p-8 text-center">
              <p className="text-warm-gray text-base leading-relaxed mb-6">
                If you would like to be invited to Co-Founders, Amber and
                Edj&apos;s, private donkey events, join our friends and family
                community so you can receive personal email invitations.
              </p>
              <form action="#" className="flex gap-2 max-w-sm mx-auto">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 bg-cream border border-sand/20 rounded-full px-4 py-2.5 text-sm text-charcoal placeholder:text-warm-gray/40 focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra/40"
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

          <p className="text-center text-warm-gray/50 text-xs mt-4">
            No spam, ever. Just donkey love from Scenic, AZ.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-charcoal">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Help Us Keep the Hay Barn Full
          </h2>
          <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto">
            With your support, we can give every donkey the nutrition they
            deserve — healthy, happy, and pain-free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/#donate"
              className="bg-terra hover:bg-terra-dark text-white px-10 py-4 rounded-full text-lg font-semibold transition-colors shadow-lg"
            >
              Join the Hay Supper Club
            </a>
            <a
              href="/how-to-help"
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-10 py-4 rounded-full text-lg font-semibold transition-all"
            >
              More Ways to Help
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
