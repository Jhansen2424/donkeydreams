import type { Metadata } from "next";
import VirtualVisitHero from "@/components/VirtualVisitHero";
import VirtualVisitPricing from "@/components/VirtualVisitPricing";
import VirtualVisitFAQ from "@/components/VirtualVisitFAQ";
import VirtualVisitForm from "@/components/VirtualVisitForm";
import VirtualVisitPayment from "@/components/VirtualVisitPayment";

export const metadata: Metadata = {
  title: "Virtual Visits | Donkey Dreams Sanctuary",
  description:
    "Enjoy your own private virtual visit with the donkeys at Donkey Dreams Sanctuary in Scenic, Arizona.",
};

export default function VirtualVisitsPage() {
  return (
    <>
      <VirtualVisitHero />
      <VirtualVisitPricing />
      <VirtualVisitFAQ />
      <VirtualVisitForm />
      <VirtualVisitPayment />
    </>
  );
}
