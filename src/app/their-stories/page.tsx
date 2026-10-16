import type { Metadata } from "next";
import TheirStoriesPage from "@/components/home2/TheirStoriesPage";

// Redesigned Their Stories (Amber's stories, 10/15/2026). New route; the old
// /donkeys page is not linked from any redesigned page.

export const metadata: Metadata = {
  title: "Their Stories | Donkey Dreams Sanctuary",
  description:
    "Meet Gabriel, Jack-Jack, Xander and the Brave Herd: the wild burros and families at Donkey Dreams Sanctuary, and the stories of how they found their way home.",
};

export default function TheirStoriesRoute() {
  return <TheirStoriesPage />;
}
