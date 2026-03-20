import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "What's New | Donkey Dreams Sanctuary",
  description:
    "2025 Impact Report — A year of care, growth & gratitude at Donkey Dreams Sanctuary. See how your support changed lives.",
};

const impactStats = [
  { number: "29", label: "New Donkeys Rescued" },
  { number: "10", label: "Donkey Families at Home" },
  { number: "14", label: "Donkeys Under Age Two" },
  { number: "26%", label: "Sanctuary Growth" },
];

const careStats = [
  {
    number: "14,600",
    label: "Specially Prepared Meals",
    description: "Made to meet each donkey's unique dietary needs",
    icon: "🌾",
  },
  {
    number: "7,300",
    label: "Supplement & Medication Blends",
    description: "Individualized blends for seniors and special needs donkeys",
    icon: "💊",
  },
  {
    number: "200+",
    label: "Bandage Changes for Gabriel",
    description: "Plus 3 custom-designed prosthetic legs, just for him",
    icon: "🩹",
  },
];

const shelterImprovements = [
  "A dedicated space for pregnant mamas to safely give birth and nurse newborns",
  "New enclosures for the Dragon, Angel, and Pegasus herds",
  "A new area for intake",
  "A new area for medical care",
];

const highlights = [
  {
    title: "Three New Babies!",
    names: "Dusk, Celeste & Star",
    story: null,
    icon: "🍼",
  },
  {
    title: "Xander Reunited with His Family",
    names: null,
    story:
      "Xander's survival was nothing short of a miracle! After being saved from a slaughter auction, we found him a year later at a rescue in Texas. We adopted him and reunited Xander with his girlfriend and his 2 boys who he met for the first time at Donkey Dreams!",
    icon: "🫏",
  },
  {
    title: "Moses Reunited with His Mama",
    names: "Moses & Nelly Belle",
    story:
      "Originally at a rescue, Moses was separated from his mother and adopted out. We were able to adopt his mother, Nelly Belle. After some efforts, we found and adopted Moses! Now, they have a permanent forever home together.",
    icon: "💕",
  },
  {
    title: 'Gabriel and His "Magic Leg"',
    names: null,
    story:
      "Once a stray and alone, Gabriel was found with a severed leg when he was just a few months old. Today, he walks with a prosthetic \"magic\" leg and is a cherished adopted member of the Brave herd family.",
    icon: "✨",
  },
];

export default function WhatsNewPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-20 bg-charcoal overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-no-repeat opacity-30"
          style={{
            backgroundImage: "url('/whats new hero.webp')",
            backgroundPosition: "center 20%",
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            A Year of Care, Growth &{" "}
            <span className="text-sand-light">Gratitude</span>
          </h1>
          <p className="text-white/70 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            From urgent rescues to joyful reunions — here&apos;s what your
            support made possible in 2025.
          </p>
        </div>
      </section>

      {/* Letter from Founders */}
      <section className="py-24 bg-cream">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sand font-semibold tracking-widest uppercase text-sm mb-3">
              A Message from Amber &amp; Edj
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-charcoal">
              Letter from the Founders
            </h2>
          </div>

          <div className="relative bg-white rounded-3xl shadow-lg border border-sand/10 p-8 sm:p-12 lg:p-16">
            <div className="absolute -top-6 left-8 sm:left-12 text-8xl text-sand/20 font-serif leading-none select-none">
              &ldquo;
            </div>

            <div className="grid md:grid-cols-[1fr_200px] gap-8 items-start">
              <div className="space-y-6 text-warm-gray text-lg leading-relaxed">
                <p>Dear Supporters,</p>
                <p>
                  2025, our third as Donkey Dreams, was a year full of urgent
                  rescues, long days, late nights, and more donkey needs than we
                  could have ever been prepared for.
                </p>
                <p>
                  Most days, our focus was far from fundraising, newsletters or
                  spreadsheets. It was on feeding, healing, and making sure every
                  donkey was safe before the sun went down. Through it all, our
                  amazing supporters showed up.
                </p>
                <p className="font-medium text-charcoal">
                  Your continued support reminded us that we weren&apos;t
                  carrying this work alone.
                </p>
                <p>
                  Because of you, our sanctuary is filled with thriving donkey
                  families, healthy and playful babies, safe and happy mamas, and
                  seniors retiring with the care they deserve. This haven for
                  donkeys does not exist without you.
                </p>
                <p>
                  From the bottom of our hearts, and from every smoochy donkey
                  nose at the sanctuary, thank you for believing in us and our
                  labor of love. We are endlessly grateful to be on this journey
                  with you.
                </p>
              </div>

              {/* Founder photo placeholder */}
              <div className="hidden md:block">
                <div className="aspect-square rounded-2xl overflow-hidden relative">
                  <Image
                    src="/edj amber 3 .png"
                    alt="Amber and Edj, Co-Founders"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Signature */}
            <div className="mt-10 pt-8 border-t border-sand/15">
              <p
                className="text-2xl text-charcoal italic"
                style={{
                  fontFamily:
                    "var(--font-lora), Georgia, 'Times New Roman', serif",
                }}
              >
                With gratitude,
              </p>
              <p className="text-charcoal font-semibold mt-1">
                Edj and Amber
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Stats — big numbers */}
      <section className="py-20 bg-sage">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-white/70 font-semibold tracking-widest uppercase text-sm mb-3">
              By the Numbers
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              A Growing Donkey Family
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {impactStats.map((stat) => (
              <div
                key={stat.label}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/10"
              >
                <div className="text-4xl sm:text-5xl font-bold text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-white/70 text-sm font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-white/60 text-base max-w-lg mx-auto">
              Two entire donkey families were rescued, ensuring they will stay
              together forever.
            </p>
          </div>
        </div>
      </section>

      {/* Favorite Highlights */}
      <section className="py-24 bg-cream">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sand font-semibold tracking-widest uppercase text-sm mb-3">
              Stories That Moved Us
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-charcoal">
              Favorite Highlights of the Year
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-sand/10 hover:shadow-md transition-shadow"
              >
                {/* Photo placeholder */}
                <div className="h-48 bg-sand/10 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-5xl mb-2">{item.icon}</div>
                    <p className="text-warm-gray/50 text-xs italic">
                      Photo coming soon
                    </p>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-charcoal mb-1">
                    {item.title}
                  </h3>
                  {item.names && (
                    <p className="text-sky text-sm font-medium mb-3">
                      {item.names}
                    </p>
                  )}
                  {item.story && (
                    <p className="text-warm-gray text-sm leading-relaxed">
                      {item.story}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safe Spaces */}
      <section className="py-24 bg-cream-dark">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Photo placeholder */}
            <div className="bg-sand/10 rounded-3xl aspect-[4/3] flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-3">🏠</div>
                <p className="text-warm-gray/50 text-sm italic">
                  Shelter photo
                </p>
              </div>
            </div>

            <div>
              <p className="text-sage font-semibold tracking-widest uppercase text-sm mb-3">
                Infrastructure
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-charcoal mb-6">
                Safe Spaces to Rest and Grow
              </h2>
              <p className="text-warm-gray text-lg leading-relaxed mb-6">
                <strong className="text-charcoal">Four new shelters</strong> and{" "}
                <strong className="text-charcoal">one expanded shelter</strong>{" "}
                were built this year, including:
              </p>
              <ul className="space-y-3">
                {shelterImprovements.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-sage flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-warm-gray text-base leading-relaxed">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Custom Made With Love — care stats */}
      <section className="py-24 bg-cream">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sand font-semibold tracking-widest uppercase text-sm mb-3">
              Personalized Care
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-charcoal">
              Custom Made With Love
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {careStats.map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-2xl p-8 text-center shadow-sm border border-sand/10 hover:shadow-md transition-shadow"
              >
                <span className="text-4xl mb-4 block">{stat.icon}</span>
                <p className="text-4xl font-bold text-terra mb-1">
                  {stat.number}
                </p>
                <p className="text-charcoal font-bold text-base mb-2">
                  {stat.label}
                </p>
                <p className="text-warm-gray text-sm leading-relaxed">
                  {stat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Volunteer Spotlight */}
      <section className="py-24 bg-sage">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-white/70 font-semibold tracking-widest uppercase text-sm mb-3">
              Volunteer Spotlight
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              What It Means to Love Donkeys
            </h2>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 sm:p-12 border border-white/10">
            <div className="space-y-6 text-white/90 text-lg leading-relaxed">
              <p className="font-semibold text-white text-xl italic">
                &ldquo;Volunteering at Donkey Dreams has become a meaningful
                part of my life.&rdquo;
              </p>
              <p>
                Donkeys are often misunderstood animals. They are gentle,
                intelligent and deeply emotional beings. They have different
                histories and came to the sanctuary for different reasons. Being
                able to show them consistent kindness feels like giving them back
                a piece of the dignity they always deserved.
              </p>
              <p className="font-semibold text-white text-xl italic">
                &ldquo;Every time I walk into the sanctuary, I&apos;m reminded
                that healing doesn&apos;t happen overnight.&rdquo;
              </p>
              <p>
                It happens in small, quiet moments — a donkey who once kept
                their distance finally accepts a head rub or a brushing, or one
                who used to flinch if you touched them now leaning in for an
                embrace. Those breakthroughs are powerful. They remind me that
                patience and compassion can rebuild trust, even after hardship.
              </p>
              <p className="font-semibold text-white text-xl italic">
                &ldquo;I volunteer because these animals matter. They teach me
                to slow down, to listen, and to appreciate the simple joy of
                connection.&rdquo;
              </p>
              <p>
                The sanctuary isn&apos;t just a place where donkeys recover —
                it&apos;s a place where people do too. Being part of their
                journey gives me a sense of purpose and a deeper appreciation
                for the resilience of all living beings.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-white/15 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-white font-bold">K</span>
              </div>
              <div>
                <p className="text-white font-semibold">Keri</p>
                <p className="text-white/60 text-sm">
                  Donkey Dreams Volunteer
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Thank You — donors & volunteers */}
      <section className="py-24 bg-cream-dark">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sand font-semibold tracking-widest uppercase text-sm mb-3">
              Because of You
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-charcoal">
              All Made Possible by Your Love
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-8">
            {/* Donors */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-sand/10 text-center">
              <div className="w-16 h-16 rounded-full bg-terra/10 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-terra"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-charcoal mb-3">
                Our Donors &amp; Sponsors
              </h3>
              <p className="text-warm-gray leading-relaxed">
                Your support allows us to provide daily care, nutritious food,
                medical treatment, and safe shelter for every donkey who calls
                our sanctuary home.
              </p>
            </div>

            {/* Volunteers */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-sand/10 text-center">
              <div className="w-16 h-16 rounded-full bg-sky/10 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-sky"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-charcoal mb-3">
                10 Dedicated Volunteers
              </h3>
              <p className="text-warm-gray leading-relaxed mb-4">
                Your time, hearts, and loving hands support our donkeys every
                single day.
              </p>
              <p className="text-3xl font-bold text-sky">3,421</p>
              <p className="text-warm-gray text-sm">
                Total Hours of Donated Care
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-charcoal">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Help Us Do It Again in 2026
          </h2>
          <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto">
            Every dollar, every visit, every share makes this work possible.
            Join us in giving more donkeys the life they deserve.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/#donate"
              className="bg-terra hover:bg-terra-dark text-white px-10 py-4 rounded-full text-lg font-semibold transition-colors shadow-lg"
            >
              Donate Now
            </a>
            <a
              href="/donkeys"
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-10 py-4 rounded-full text-lg font-semibold transition-all"
            >
              Meet the Herd
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
