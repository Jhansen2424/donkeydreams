import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import SiteShell from "@/components/SiteShell";
import "./globals.css";

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-opensans",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  // Absolute base for share-preview images (opengraph-image.jpg) and links.
  metadataBase: new URL("https://www.donkeydreams.org"),
  title: "Donkey Dreams Sanctuary | Preserving the Wild Burro Spirit",
  description:
    "Donkey Dreams Sanctuary gives entire wild burro families a forever home in Kingman, Arizona: together, with room to roam, and the freedom to still be who they are.",
  twitter: { card: "summary_large_image" },
  keywords: [
    "donkey sanctuary",
    "donkey rescue",
    "wild burro sanctuary",
    "Kingman AZ",
    "animal rescue",
    "donate",
    "nonprofit",
  ],
  openGraph: {
    title: "Donkey Dreams Sanctuary | Preserving the Wild Burro Spirit",
    description:
      "Entire wild burro families, kept whole, with room to roam and the freedom to still be who they are.",
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
        <Analytics />
      </body>
    </html>
  );
}
