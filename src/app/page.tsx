import Hero from "@/components/Hero";
import FeaturedDonkeys from "@/components/FeaturedDonkeys";
import DonationWidget from "@/components/DonationWidget";
import Gallery from "@/components/Gallery";
import Impact from "@/components/Impact";
import Visit from "@/components/Visit";
import Newsletter from "@/components/Newsletter";

export default function Home() {
  return (
    <>
      <Hero />
      <FeaturedDonkeys />
      <DonationWidget />
      <Gallery />
      <Impact />
      <Visit />
      <Newsletter />
    </>
  );
}
