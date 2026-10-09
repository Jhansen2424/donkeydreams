"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isApp = pathname.startsWith("/app");
  const isAuth = pathname.startsWith("/auth");
  // The homepage-redesign preview ships its own nav + footer (per the 10/8
  // copy doc) — the old chrome would double up on top of it.
  const isNewHome = pathname.startsWith("/new-home");

  // /app and /auth render their own layout chrome — skip the public navbar
  // and footer so signing in / using the dashboard isn't framed by the
  // marketing site shell.
  if (isApp || isAuth || isNewHome) {
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
