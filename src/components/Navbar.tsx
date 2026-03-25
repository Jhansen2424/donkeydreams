"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

const navLinks = [
  { href: "/our-story", label: "Our Story" },
  { href: "/donkeys", label: "Meet the Donkeys" },
  { href: "/whats-new", label: "Bray-ing News" },
  {
    href: "/how-to-help",
    label: "How To Help",
    children: [
      { href: "/how-to-help", label: "How To Help" },
      { href: "/hay-supper-club", label: "Hay Supper Club" },
    ],
  },
  { href: "/virtual-visits", label: "Virtual Visits" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-[0_2px_20px_rgba(68,98,162,0.08)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/DDlogo.png"
              alt="Donkey Dreams Sanctuary"
              width={160}
              height={50}
              className="h-20 w-auto"
              priority
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) =>
              link.children ? (
                <div key={link.href} className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="text-charcoal hover:text-sky transition-colors text-sm font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {link.label}
                    <svg
                      className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                      />
                    </svg>
                  </button>
                  {dropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-xl border border-sky/10 py-2 min-w-[200px]">
                      {link.children.map((child) => (
                        <a
                          key={child.href}
                          href={child.href}
                          onClick={() => setDropdownOpen(false)}
                          className="block px-5 py-3 text-sm text-charcoal hover:text-sky hover:bg-sky/5 transition-colors font-medium"
                        >
                          {child.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-charcoal hover:text-sky transition-colors text-sm font-semibold"
                >
                  {link.label}
                </a>
              )
            )}
            <a
              href="/donate"
              className="bg-sky hover:bg-sky-dark text-white px-7 py-3 rounded-full text-sm font-bold transition-all duration-300 shadow-[0_4px_15px_rgba(92,205,243,0.3)] hover:shadow-[0_6px_25px_rgba(92,205,243,0.4)]"
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
        <div className="md:hidden bg-white border-t border-sky/10">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) =>
              link.children ? (
                <div key={link.href} className="space-y-1">
                  {link.children.map((child) => (
                    <a
                      key={child.href}
                      href={child.href}
                      onClick={() => setMobileOpen(false)}
                      className="block text-charcoal hover:text-sky transition-colors text-sm font-semibold py-2"
                    >
                      {child.label}
                    </a>
                  ))}
                </div>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block text-charcoal hover:text-sky transition-colors text-sm font-semibold py-2"
                >
                  {link.label}
                </a>
              )
            )}
            <a
              href="/donate"
              onClick={() => setMobileOpen(false)}
              className="block bg-sky hover:bg-sky-dark text-white px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 text-center"
            >
              Donate Now
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
