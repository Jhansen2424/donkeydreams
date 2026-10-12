import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import StoryHome from "@/components/home2/StoryHome";

// The homepage redesign (Oct 2026): a documentary-style single scroll built
// from the client's approved 10/8 copy doc. Photos are illustrated
// placeholder scenes until the final exports arrive. The previous homepage
// components (Hero, Mission, FeaturedDonkeys, ...) still exist under
// src/components if we ever need to roll back.

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz", "SOFT", "WONK"],
});

export const metadata: Metadata = {
  title: "Donkey Dreams Sanctuary — Preserving the Wild Burro Spirit",
  description:
    "We give entire wild burro families a forever home — together, with room to roam, and the freedom to still be who they are.",
  openGraph: {
    title: "Donkey Dreams Sanctuary — Preserving the Wild Burro Spirit",
    description:
      "We give entire wild burro families a forever home — together, with room to roam, and the freedom to still be who they are.",
    url: "https://donkeydreams.org",
    siteName: "Donkey Dreams Sanctuary",
    type: "website",
  },
};

export default function Home() {
  return (
    <div className={fraunces.variable}>
      <StoryHome />
    </div>
  );
}
