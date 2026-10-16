import type { Metadata } from "next";
import FilmHome from "@/components/home2/FilmHome";

// The homepage as a film (10/13 client meeting): no scrolling — one fixed
// frame, scenes timed like a movie, YouTube-style transport. Old-site
// branding (Open Sans / cream / sky). The previous scroll version lives on
// in src/components/home2/StoryHome.tsx if we ever need to roll back.

export const metadata: Metadata = {
  title: "Donkey Dreams Sanctuary — Preserving the Wild Burro Spirit",
  description:
    "We give entire wild burro families a forever home — together, with room to roam, and the freedom to still be who they are.",
  openGraph: {
    title: "Donkey Dreams Sanctuary — Preserving the Wild Burro Spirit",
    description:
      "We give entire wild burro families a forever home — together, with room to roam, and the freedom to still be who they are.",
    url: "https://www.donkeydreams.org",
    siteName: "Donkey Dreams Sanctuary",
    type: "website",
  },
};

export default function Home() {
  return <FilmHome />;
}
