"use client";

// The hamburger menu for phones and small tablets (client, 2026-10-15). The
// headers show their links only from md up; below that, this button opens a
// full-screen sheet with the same links and Donate Now. Shared by the film
// homepage's overlay header and the redesigned pages' header.

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function MobileMenu({
  links,
  donateHref = "/donate",
  tone = "light",
}: {
  links: { label: string; href: string }[];
  donateHref?: string;
  /** "light" for a dark header over a photo, "dark" for the cream header. */
  tone?: "light" | "dark";
}) {
  const [open, setOpen] = useState(false);

  // Nothing behind the sheet scrolls, and Escape closes it.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className={`md:hidden shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
          tone === "light" ? "text-white bg-white/15 backdrop-blur hover:bg-white/30" : "text-charcoal hover:bg-charcoal/5"
        }`}
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Portalled to <body>: the headers use backdrop-blur, which makes them
          the containing block for fixed children, so an inline sheet was
          trapped inside the 64px header and see-through. */}
      {open && typeof document !== "undefined" && createPortal(
        <div role="dialog" aria-modal="true" aria-label="Menu" className="md:hidden fixed inset-0 z-50 bg-cream flex flex-col">
          <div className="flex items-center justify-between px-4 h-16 border-b border-card-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/DDlogo.png" alt="Donkey Dreams Sanctuary" className="h-12 w-auto" />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="w-10 h-10 rounded-full flex items-center justify-center text-charcoal hover:bg-charcoal/5"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="flex-1 flex flex-col px-6 py-6 gap-1">
            <Link href="/" onClick={() => setOpen(false)} className="py-3 text-2xl font-extrabold text-charcoal">
              Home
            </Link>
            {links.map((n) => (
              <Link
                key={n.label}
                href={n.href}
                onClick={() => setOpen(false)}
                className="py-3 text-2xl font-extrabold text-charcoal hover:text-sky-dark transition-colors"
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="px-6 pb-8">
            <Link
              href={donateHref}
              onClick={() => setOpen(false)}
              className="block w-full text-center px-6 py-4 rounded-full bg-sky text-charcoal text-lg font-extrabold hover:bg-sky-light transition-colors"
            >
              Donate Now
            </Link>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
