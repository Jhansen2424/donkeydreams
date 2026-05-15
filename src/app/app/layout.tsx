import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Sidebar from "@/components/app/Sidebar";
import TopBar from "@/components/app/TopBar";
import MobileNav from "@/components/app/MobileNav";
import { ScheduleProvider } from "@/lib/schedule-context";
import { ParkingLotProvider } from "@/lib/parking-lot-context";
import { MedicalProvider } from "@/lib/medical-context";
import { ToastProvider } from "@/lib/toast-context";
import { ProvidersProvider } from "@/lib/providers-context";
import { auth, isAllowedEmail } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Donkey Dreams — Sanctuary Manager",
  description: "Donkey Dreams Sanctuary management portal.",
};

// Auth-gated layout. Two layers of protection:
//   1. middleware.ts redirects unauthenticated requests to /auth/sign-in.
//   2. This layout enforces an email allowlist — even if a stranger signs up
//      (Better Auth's restricted-signup support is "coming soon"), they can't
//      reach /app because their email isn't on the list.
// Force dynamic since auth.getSession() reads cookies.
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { data: session } = await auth.getSession();

  if (!session?.user) {
    // Middleware should have already handled this, but belt-and-suspenders
    // for any matcher gap.
    redirect("/auth/sign-in");
  }

  if (!isAllowedEmail(session.user.email)) {
    // Logged in but not on the allowlist — kick to a denial page.
    redirect("/auth/access-denied");
  }

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
