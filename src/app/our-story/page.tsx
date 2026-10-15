import type { Metadata } from "next";
import OurStoryPage from "@/components/home2/OurStoryPage";

// Redesigned Our Story (client copy, 10/15/2026). Replaces the old page.

export const metadata: Metadata = {
  title: "Our Story | Donkey Dreams Sanctuary",
  description:
    "How Donkey Dreams began: a wild mustang sanctuary, a calling to burros, Pink and Eli, and a sanctuary in Kingman, Arizona built to keep wild burro families whole.",
};

export default function OurStoryRoute() {
  return <OurStoryPage />;
}
