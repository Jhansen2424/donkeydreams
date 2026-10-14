"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isApp = pathname.startsWith("/app");
  const isAuth = pathname.startsWith("/auth");
  // The redesigned homepage ships its own nav + footer (per the 10/8 copy
  // doc) — the old chrome would double up on top of it. Other marketing
  // pages keep the classic navbar until they're redesigned too.
  const isStoryHome = pathname === "/" || pathname.startsWith("/new-home");
  // Redesigned pages carry the new header/footer (home2/SiteChrome).
  const isRedesigned = pathname.startsWith("/donate");

  // /app and /auth render their own layout chrome — skip the public navbar
  // and footer so signing in / using the dashboard isn't framed by the
  // marketing site shell.
  if (isApp || isAuth || isStoryHome || isRedesigned) {
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
