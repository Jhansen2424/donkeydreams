import type { Metadata } from "next";
import DonatePage from "@/components/DonatePage";

export const metadata: Metadata = {
  title: "Donate | Donkey Dreams Sanctuary",
  description:
    "Help keep their dreams alive. Donate to Donkey Dreams Sanctuary and support rescued donkeys in Scenic, Arizona. 100% of donations go directly to donkey care.",
};

export default function DonateRoute() {
  return <DonatePage />;
}
