import type { Metadata } from "next";
import SaveMoreFamiliesPage from "@/components/home2/SaveMoreFamiliesPage";

// Redesigned Save More Families (client copy, 10/15/2026). New route; the old
// /how-to-help page is not linked from any redesigned page.

export const metadata: Metadata = {
  title: "Save More Families | Donkey Dreams Sanctuary",
  description:
    "The Save More Families Fund brings the Donkey Dreams blueprint, proven in Kingman, Arizona, to new small sanctuaries where every wild burro is known by name.",
};

export default function SaveMoreFamiliesRoute() {
  return <SaveMoreFamiliesPage />;
}
