import type { Metadata } from "next";
import ImpactPage from "@/components/home2/ImpactPage";

// "Make an Impact" — the redesigned giving page (copy revised 10/14/2026).
// Replaces the old donate page, whose Zeffy/PayPal buttons were placeholders.

export const metadata: Metadata = {
  title: "Make an Impact | Donkey Dreams Sanctuary",
  description:
    "Help keep wild burro families whole. Join Herd Insider, give monthly through the Burro Family Circle, or give once to Donkey Dreams Sanctuary — a GFAS-accredited sanctuary with no paid staff.",
};

export default function DonateRoute() {
  return <ImpactPage />;
}
