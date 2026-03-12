import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
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
      <body className={`${geistSans.variable} antialiased`}>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
