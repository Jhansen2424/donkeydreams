import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-charcoal text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/donkey-logo.png"
                alt="Donkey Dreams Sanctuary logo"
                width={48}
                height={48}
                className="object-contain"
              />
              <span className="text-xl font-bold tracking-tight">
                Donkey Dreams Sanctuary
              </span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed max-w-md mb-4">
              Providing forever homes for rescued donkeys in the beautiful
              Arizona desert. Every donkey deserves a life free from suffering.
            </p>
            <p className="text-white/40 text-xs">
              Donkey Dreams Sanctuary is a registered 501(c)(3) nonprofit
              organization.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sand font-semibold text-sm uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {[
                { href: "/our-story", label: "Our Story" },
                { href: "#donkeys", label: "Meet the Donkeys" },
                { href: "#gallery", label: "Gallery" },
                { href: "#donate", label: "Donate" },
                { href: "#visit", label: "Visit Us" },
              ].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-white/60 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sand font-semibold text-sm uppercase tracking-wider mb-4">
              Contact
            </h3>
            <ul className="space-y-2 text-white/60 text-sm">
              <li>Scenic, AZ</li>
              <li>
                <a
                  href="mailto:info@donkeydreams.org"
                  className="hover:text-white transition-colors"
                >
                  info@donkeydreams.org
                </a>
              </li>
            </ul>

            {/* Social */}
            <div className="flex gap-4 mt-6">
              {["Facebook", "Instagram"].map((platform) => (
                <a
                  key={platform}
                  href="#"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-sand transition-colors flex items-center justify-center"
                  aria-label={platform}
                >
                  <span className="text-xs font-medium">
                    {platform[0]}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 text-center">
          <p className="text-white/40 text-xs">
            &copy; {new Date().getFullYear()} Donkey Dreams Sanctuary. All
            rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
