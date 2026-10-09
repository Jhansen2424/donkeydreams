import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import StoryHome from "@/components/home2/StoryHome";

// PREVIEW route for the homepage redesign (Oct 2026). Lives beside the real
// homepage so Amber + Edj can review the full experience before it replaces
// src/app/page.tsx. Copy comes verbatim from the client's approved
// "Donkey-Dreams-New-Homepage-Copy" doc (10/8); photos are labeled
// placeholders until final exports arrive.

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz", "SOFT", "WONK"],
});

export const metadata: Metadata = {
  title: "Donkey Dreams Sanctuary — Preserving the Wild Burro Spirit",
  description:
    "We give entire wild burro families a forever home — together, with room to roam, and the freedom to still be who they are.",
  robots: { index: false }, // preview — don't index until it ships as /
};

export default function NewHomePage() {
  return (
    <div className={fraunces.variable}>
      <StoryHome />
    </div>
  );
}
