import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import SiteShell from "@/components/SiteShell";
import "./globals.css";

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-opensans",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Donkey Dreams Sanctuary | Where Donkeys Are Free to Dream",
  description:
    "Donkey Dreams Sanctuary rescues, rehabilitates, and provides forever homes for donkeys in Scenic, Arizona. Donate today to help us care for donkeys in need.",
  keywords: [
    "donkey sanctuary",
    "donkey rescue",
    "Scenic AZ",
    "animal rescue",
    "donate",
    "nonprofit",
  ],
  openGraph: {
    title: "Donkey Dreams Sanctuary | Where Donkeys Are Free to Dream",
    description:
      "Rescuing and providing forever homes for donkeys in the Arizona desert.",
    url: "https://donkeydreams.org",
    siteName: "Donkey Dreams Sanctuary",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${openSans.variable} antialiased`}>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
