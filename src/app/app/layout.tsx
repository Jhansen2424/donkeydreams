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
import { AnimalsProvider } from "@/lib/animals-context";
import { getSessionReadOnly, isAllowedEmail } from "@/lib/auth";
import { getCurrentVolunteer } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Donkey Dreams — Sanctuary Manager",
  description: "Donkey Dreams Sanctuary management portal.",
};

// The layout calls auth.getSession() which reads cookies. Force dynamic so
// Next.js doesn't try to statically prerender it at build time.
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Server-side session check. Uses the read-only session cookie helper
  // (not auth.getSession()) because layouts aren't allowed to modify cookies
  // in Next.js — and the SDK's full getSession() always tries to refresh
  // the cookie. The middleware has already validated/refreshed the session
  // for this request; we just trust-and-verify the resulting cookie here.
  const session = await getSessionReadOnly();
  if (!session?.user) {
    redirect("/auth/sign-in");
  }
  if (!isAllowedEmail(session.user.email)) {
    redirect("/auth/access-denied");
  }

  // First name for the greeting. Order of preference:
  //   1. Linked Volunteer's name (gives us "Josh", "Amber", "Edj Fish" → "Edj")
  //   2. Auth user's display name (set at sign-up)
  //   3. The email's local part
  const volunteer = await getCurrentVolunteer();
  const firstName = (() => {
    if (volunteer?.name) return volunteer.name.split(/\s+/)[0];
    const fullName = session.user.name?.trim();
    if (fullName) return fullName.split(/\s+/)[0];
    const email = session.user.email ?? "";
    const local = email.split("@")[0] ?? "";
    if (!local) return "there";
    return local.charAt(0).toUpperCase() + local.slice(1);
  })();

  return (
    <ToastProvider>
      <ScheduleProvider>
        <ParkingLotProvider>
          <MedicalProvider>
            <ProvidersProvider>
              <AnimalsProvider>
              <div className="min-h-screen bg-cream">
                <Sidebar />
                <div className="md:ml-64 flex flex-col min-h-screen">
                  <TopBar firstName={firstName} />
                  <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
                    {children}
                  </main>
                </div>
                <MobileNav />
              </div>
              </AnimalsProvider>
            </ProvidersProvider>
          </MedicalProvider>
        </ParkingLotProvider>
      </ScheduleProvider>
    </ToastProvider>
  );
}
