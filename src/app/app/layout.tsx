import type { Metadata } from "next";
import Sidebar from "@/components/app/Sidebar";
import TopBar from "@/components/app/TopBar";
import MobileNav from "@/components/app/MobileNav";
import { ScheduleProvider } from "@/lib/schedule-context";
import { ParkingLotProvider } from "@/lib/parking-lot-context";
import { MedicalProvider } from "@/lib/medical-context";
import { ToastProvider } from "@/lib/toast-context";
import { ProvidersProvider } from "@/lib/providers-context";

export const metadata: Metadata = {
  title: "Donkey Dreams — Sanctuary Manager",
  description: "Donkey Dreams Sanctuary management portal.",
};

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ToastProvider>
      <ScheduleProvider>
        <ParkingLotProvider>
          <MedicalProvider>
            <ProvidersProvider>
              <div className="min-h-screen bg-cream">
                <Sidebar />
                <div className="md:ml-64 flex flex-col min-h-screen">
                  <TopBar />
                  <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
                    {children}
                  </main>
                </div>
                <MobileNav />
              </div>
            </ProvidersProvider>
          </MedicalProvider>
        </ParkingLotProvider>
      </ScheduleProvider>
    </ToastProvider>
  );
}
