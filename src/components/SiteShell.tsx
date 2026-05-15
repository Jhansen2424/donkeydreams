"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isApp = pathname.startsWith("/app");
  const isAuth = pathname.startsWith("/auth");

  // /app and /auth render their own layout chrome — skip the public navbar
  // and footer so signing in / using the dashboard isn't framed by the
  // marketing site shell.
  if (isApp || isAuth) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}
