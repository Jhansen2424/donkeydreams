import type { Metadata } from "next";
import Image from "next/image";
import DonkeySilhouettes from "@/components/DonkeySilhouettes";
import AnimatedCTA from "@/components/AnimatedCTA";

export const metadata: Metadata = {
  title: "Our Story | Donkey Dreams Sanctuary",
  description:
    "Learn about Donkey Dreams Sanctuary — how we started, our mission to rescue donkeys, and the team behind the sanctuary in Scenic, Arizona.",
};

export default function OurStoryPage() {
  return (
    <>
      {/* Hero banner */}
      <section className="relative pt-32 pb-20 bg-charcoal overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
          style={{
            backgroundImage:
              "url('https://donkeydreams.org/wp-content/uploads/2022/09/Where-the-donkeys-are-free-cropped-dnsd.jpg')",
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sand-light font-medium tracking-widest uppercase text-sm mb-4">
            Our Story
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            How a Dream Became a{" "}
            <span className="text-sand-light">Sanctuary</span>
          </h1>
          <p className="text-white/70 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            From a handful of rescued donkeys on a dusty patch of Arizona
            desert, to a 40-acre sanctuary that&apos;s home to over 50 donkeys
            — this is our story.
          </p>
        </div>

        {/* Walking donkey with dust trail */}
        <DonkeySilhouettes />
      </section>

      {/* Get to Know Our Sanctuary */}
      <section className="py-24 bg-cream">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8 flex justify-center">
            <Image
              src="/donkey-logo.png"
              alt="Donkey Dreams Sanctuary logo"
              width={160}
              height={160}
              className="object-contain"
            />
          </div>

          <p className="text-warm-gray font-medium tracking-[0.3em] uppercase text-sm mb-4">
            Who We Are and What We Do
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-sky-dark leading-tight mb-8">
            Get to Know Our Sanctuary
          </h2>
          <p className="text-warm-gray text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto">
            Donkey Dreams Sanctuary provides forever homes for donkeys and a
            place for humans to have intimate and meaningful donkey experiences
            with our growing donkey family.
          </p>
        </div>
      </section>

      {/* Chapter 1: The Beginning — image left, text right */}
      <section className="bg-cream-dark">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 items-center">
            {/* Photo */}
            <div className="relative h-[400px] lg:h-[600px]">
              <Image
                src="/edj amber.jpg"
                alt="Amber and Edj with a donkey"
                fill
                className="object-cover"
              />
              {/* Quote overlay */}
              <div className="absolute bottom-6 left-6 right-6 lg:bottom-10 lg:left-10 lg:right-10">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-sand/10">
                  <p className="text-charcoal italic text-base leading-relaxed">
                    &ldquo;We believe donkeys have an amazing ability to make
                    you feel loved, accepted and worthy.&rdquo;
                  </p>
                  <p className="text-sand-dark font-semibold text-sm mt-2">
                    — Amber &amp; Edj, Co-Founders
                  </p>
                </div>
              </div>
            </div>

            {/* Text */}
            <div className="py-16 lg:py-20 px-6 sm:px-10 lg:px-16">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px flex-1 bg-sand/30" />
                <span className="text-sand font-semibold tracking-widest uppercase text-xs">
                  The Beginning
                </span>
                <div className="h-px flex-1 bg-sand/30" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-charcoal mb-6">
                Born from the Heart
              </h3>
              <p className="text-warm-gray text-lg leading-relaxed mb-4">
                Donkey Dreams was birthed in our hearts when we realized some
                donkeys desire to roam open spaces with their families, have a
                special place to call their forever home and to interact with
                humans at their leisure.
              </p>
              <p className="text-warm-gray text-lg leading-relaxed">
                While we primarily exist to give donkeys who have been
                displaced from their original homes their best life, we also
                exist to make the world a better place, one donkey and human
                interaction at a time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Chapter 2: The Magic — text left, image right (flipped) */}
      <section className="bg-cream">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 items-center">
            {/* Text — shows first on mobile, second on desktop */}
            <div className="py-16 lg:py-20 px-6 sm:px-10 lg:px-16 order-2 lg:order-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px flex-1 bg-sage/30" />
                <span className="text-sage font-semibold tracking-widest uppercase text-xs">
                  The Magic
                </span>
                <div className="h-px flex-1 bg-sage/30" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-charcoal mb-6">
                More Than a Sanctuary
              </h3>
              <p className="text-warm-gray text-lg leading-relaxed mb-4">
                It&apos;s been our observation that when people interact with
                donkeys they have an increased sense of well-being, kindness
                and compassion.
              </p>
              <p className="text-warm-gray text-lg leading-relaxed">
                This isn&apos;t just a sanctuary for donkeys — it&apos;s a
                place of healing for people too. Something shifts when you
                stand in a quiet desert meadow and a donkey gently rests its
                head on your shoulder. That connection is what drives
                everything we do.
              </p>
            </div>

            {/* Photo */}
            <div className="relative h-[400px] lg:h-[600px] order-1 lg:order-2">
              <Image
                src="/person with donkey.webp"
                alt="Person interacting with a donkey at the sanctuary"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                style={{ objectPosition: "center 30%" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Chapter 3: Growing Family — image left, text right */}
      <section className="bg-cream-dark">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 items-center">
            {/* Photo */}
            <div className="relative h-[400px] lg:h-[600px]">
              <Image
                src="/herd of donkeys.webp"
                alt="Herd of donkeys in the desert"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>

            {/* Text + CTAs */}
            <div className="py-16 lg:py-20 px-6 sm:px-10 lg:px-16">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px flex-1 bg-sky/30" />
                <span className="text-sky font-semibold tracking-widest uppercase text-xs">
                  Growing Family
                </span>
                <div className="h-px flex-1 bg-sky/30" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-charcoal mb-6">
                A Herd That Keeps Growing
              </h3>
              <p className="text-warm-gray text-lg leading-relaxed mb-4">
                Since we recently adopted a number of donkeys, we would like
                to give our new donkey residents time to settle in before
                welcoming our friends and family.
              </p>
              <p className="text-warm-gray text-lg leading-relaxed mb-8">
                In the meantime, many of our adopted donkeys still need
                sponsors — and every bit of support helps us provide the
                care, food, and veterinary attention they deserve.
              </p>

              {/* CTA cards */}
              <div className="grid sm:grid-cols-2 gap-4">
                <a
                  href="/#donate"
                  className="group bg-terra/5 hover:bg-terra/10 border-2 border-terra/20 hover:border-terra/40 rounded-2xl p-5 text-center transition-all"
                >
                  <div className="w-12 h-12 rounded-full bg-terra/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-terra" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <h4 className="font-bold text-charcoal mb-1">
                    Sponsor a Donkey
                  </h4>
                  <p className="text-warm-gray text-sm">
                    See who needs your help
                  </p>
                </a>

                <a
                  href="#"
                  className="group bg-sky/5 hover:bg-sky/10 border-2 border-sky/20 hover:border-sky/40 rounded-2xl p-5 text-center transition-all"
                >
                  <div className="w-12 h-12 rounded-full bg-sky/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-sky" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h4 className="font-bold text-charcoal mb-1">
                    Join Our Community
                  </h4>
                  <p className="text-warm-gray text-sm">
                    Get private donkey experience invites
                  </p>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* By the Numbers — horizontal scrolling ticker */}
      <section className="py-16 bg-charcoal overflow-hidden">
        <div className="flex items-center gap-16 whitespace-nowrap animate-scroll-ticker">
          {[
            { number: "50+", label: "Donkeys Rescued" },
            { number: "40", label: "Acres of Desert Sanctuary" },
            { number: "2", label: "Passionate Co-Founders" },
            { number: "365", label: "Days of Care Per Year" },
            { number: "100%", label: "Donations to Donkeys" },
            { number: "∞", label: "Love Given" },
            { number: "50+", label: "Donkeys Rescued" },
            { number: "40", label: "Acres of Desert Sanctuary" },
            { number: "2", label: "Passionate Co-Founders" },
            { number: "365", label: "Days of Care Per Year" },
            { number: "100%", label: "Donations to Donkeys" },
            { number: "∞", label: "Love Given" },
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-4 px-4">
              <span className="text-4xl sm:text-5xl font-extrabold text-sand-light">
                {stat.number}
              </span>
              <span className="text-white/50 text-sm font-medium uppercase tracking-wider">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* How It Got Started — letter-style narrative */}
      <section className="py-24 bg-cream">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section heading */}
          <div className="text-center mb-16">
            <p className="text-sand font-semibold tracking-widest uppercase text-sm mb-3">
              In Our Own Words
            </p>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-charcoal leading-tight">
              How It Got{" "}
              <span className="text-sand-dark">Started</span>
            </h2>
          </div>

          {/* Letter body */}
          <div className="relative bg-white rounded-3xl shadow-lg border border-sand/10 p-8 sm:p-12 lg:p-16">
            {/* Decorative quote mark */}
            <div className="absolute -top-6 left-8 sm:left-12 text-8xl text-sand/20 font-serif leading-none select-none">
              &ldquo;
            </div>

            <div className="space-y-6 text-warm-gray text-lg leading-relaxed">
              <p>
                Donkey Dreams Sanctuary is the manifestation of our desire to
                create environments for donkeys to thrive and to help humans
                increase their well being. After years of passionately supporting
                people in improving their physical and emotional well being, we
                expanded our passion circle to donkeys when we learned about the
                plight of wild burros on American soil.
              </p>
              <p>
                Since then we have dreamed of creating a place where donkeys who
                have been rescued or removed from their original habitat could
                live their best life in a forever home at our sanctuary.
              </p>

              {/* Pull quote */}
              <div className="my-10 py-8 px-6 sm:px-10 border-l-4 border-sand bg-sand/5 rounded-r-2xl">
                <p className="text-charcoal text-xl sm:text-2xl font-semibold italic leading-snug">
                  &ldquo;Not all donkeys were created to be people&apos;s pets.
                  Some donkeys desire to roam open spaces with their families,
                  have a special place to call their forever home.&rdquo;
                </p>
              </div>

              <p>
                The more time we spent with wild burros and rescued donkeys, the
                more we saw that not all donkeys were created to be peoples&apos;
                pets. Some donkeys desire to roam open spaces with their
                families, have a special place to call their forever home and to
                interact with humans at their leisure.
              </p>
              <p>
                Our dream to create a donkey sanctuary was accelerated when Pink
                and Eli were born. We bonded so deeply with these baby donkeys
                that we decided to open our sanctuary as soon as we found the
                best home for it. Within 6 months, we found a location for our
                sanctuary and adopted them soon after.
              </p>
              <p>
                We will never forget the overwhelming joy we felt when we brought
                Pink, Eli and their moms home to their 2.5 acre field where they
                could roam, explore, play and be as close to a wild burro family
                as possible. This moment will forever inspire us to give as many
                wild burros and displaced domestic donkeys a forever home that
                best aligns with their accustomed habitat.
              </p>
            </div>

            {/* Signature */}
            <div className="mt-12 pt-8 border-t border-sand/15 flex flex-col sm:flex-row items-center gap-6">
              {/* Two circular founder photos */}
              <div className="flex -space-x-4">
                <div className="w-16 h-16 rounded-full bg-sand/15 border-3 border-white flex items-center justify-center shadow-md">
                  <span className="text-2xl">📸</span>
                </div>
                <div className="w-16 h-16 rounded-full bg-sage/15 border-3 border-white flex items-center justify-center shadow-md">
                  <span className="text-2xl">📸</span>
                </div>
              </div>
              <div>
                <p className="text-2xl text-charcoal italic" style={{ fontFamily: "var(--font-lora), Georgia, 'Times New Roman', serif" }}>
                  — Amber + Edj
                </p>
                <p className="text-warm-gray text-sm mt-1">
                  Co-Founders, Donkey Dreams Sanctuary
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Meet the Founders — overlapping card layout */}
      <section className="py-24 bg-cream">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sand font-semibold tracking-widest uppercase text-sm mb-3">
              The Dreamers Behind the Dream
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-charcoal mb-4">
              Meet Amber &amp; Edj
            </h2>
            <p className="text-warm-gray text-lg max-w-xl mx-auto">
              Two people who turned a shared love of donkeys into a lifelong
              mission.
            </p>
          </div>

          {/* Full-width photo of both founders together */}
          <div className="relative rounded-3xl overflow-hidden mb-12">
            <div className="relative h-[700px] sm:h-[826px] rounded-3xl overflow-hidden">
              <Image
                src="/edj amber 2.jpg"
                alt="Amber and Edj together at the sanctuary"
                fill
                className="object-cover object-bottom"
              />
            </div>
          </div>

          {/* Two bio cards that overlap the photo slightly */}
          <div className="grid md:grid-cols-2 gap-6 -mt-24 relative z-10 px-4 sm:px-8">
            {/* Amber */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-sand/10">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 rounded-full bg-sand/15 flex items-center justify-center flex-shrink-0">
                  <div className="text-3xl">📸</div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-charcoal">Amber</h3>
                  <p className="text-sand font-medium text-sm">Co-Founder</p>
                </div>
              </div>
              <p className="text-warm-gray leading-relaxed mb-4">
                With a deep love for animals and a vision for a kinder world,
                Amber poured her heart into creating a space where donkeys could
                live free and humans could reconnect with nature.
              </p>
              <p className="text-warm-gray leading-relaxed">
                She saw something in these gentle creatures that most people
                overlook — their ability to heal, to teach patience, and to
                love unconditionally.
              </p>
            </div>

            {/* Edj */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-sand/10">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 rounded-full bg-sage/15 flex items-center justify-center flex-shrink-0">
                  <div className="text-3xl">📸</div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-charcoal">Edj</h3>
                  <p className="text-sand font-medium text-sm">Co-Founder</p>
                </div>
              </div>
              <p className="text-warm-gray leading-relaxed mb-4">
                The hands that built the fences, hauled the hay, and never said
                no to one more rescue. Edj brings the grit and heart that keeps
                the sanctuary running every single day.
              </p>
              <p className="text-warm-gray leading-relaxed">
                Rain or shine, 365 days a year — when a donkey needs help,
                Edj is the first one there.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* "A Day at the Sanctuary" — visual timeline strip */}
      <section className="py-24 bg-cream-dark">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sage font-semibold tracking-widest uppercase text-sm mb-3">
              From Sunrise to Sunset
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-charcoal mb-4">
              A Day at the Sanctuary
            </h2>
            <p className="text-warm-gray text-lg max-w-xl mx-auto">
              Every day is filled with purpose. Here&apos;s what life looks like
              for our donkeys.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                time: "6:00 AM",
                title: "Morning Rounds",
                desc: "Health checks, fresh water, and breakfast for the whole herd.",
                color: "bg-sand/10",
                accent: "text-sand-dark",
                icon: "🌅",
              },
              {
                time: "9:00 AM",
                title: "Grooming & Care",
                desc: "Brushing, hoof maintenance, and one-on-one time with each donkey.",
                color: "bg-sage/10",
                accent: "text-sage-dark",
                icon: "🪮",
              },
              {
                time: "1:00 PM",
                title: "Roam & Play",
                desc: "Open pasture time where the donkeys explore, socialize, and just be donkeys.",
                color: "bg-sky/10",
                accent: "text-sky-dark",
                icon: "🌵",
              },
              {
                time: "5:00 PM",
                title: "Evening Wind-Down",
                desc: "Dinner service, evening treats, and watching the desert sunset together.",
                color: "bg-terra/10",
                accent: "text-terra-dark",
                icon: "🌄",
              },
            ].map((item) => (
              <div
                key={item.time}
                className={`${item.color} rounded-2xl p-6 hover:shadow-md transition-shadow`}
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <p className={`${item.accent} font-bold text-xs uppercase tracking-wider mb-2`}>
                  {item.time}
                </p>
                <h3 className="text-lg font-bold text-charcoal mb-2">
                  {item.title}
                </h3>
                <p className="text-warm-gray text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA — animated */}
      <AnimatedCTA />
    </>
  );
}
