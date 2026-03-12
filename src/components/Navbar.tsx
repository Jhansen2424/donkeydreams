"use client";

import { useState } from "react";
import Link from "next/link";

const navLinks = [
  { href: "/our-story", label: "Our Story" },
  { href: "/donkeys", label: "Meet the Donkeys" },
  { href: "/how-to-help", label: "How To Help" },
  { href: "#visit", label: "Visit" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-cream/90 backdrop-blur-md border-b border-sand/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sand flex items-center justify-center">
              <span className="text-white font-bold text-lg">D</span>
            </div>
            <div>
              <span className="text-xl font-bold text-charcoal tracking-tight">
                Donkey Dreams
              </span>
              <span className="hidden sm:block text-xs text-warm-gray">
                Sanctuary
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-warm-gray hover:text-charcoal transition-colors text-sm font-medium"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#donate"
              className="bg-terra hover:bg-terra-dark text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-colors"
            >
              Donate Now
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-charcoal"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden bg-cream border-t border-sand/20">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block text-warm-gray hover:text-charcoal transition-colors text-sm font-medium py-2"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#donate"
              onClick={() => setMobileOpen(false)}
              className="block bg-terra hover:bg-terra-dark text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-colors text-center"
            >
              Donate Now
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
