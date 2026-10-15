"use client";

// A button that opens a Zeffy form in an on-page pop-up (client 10/14:
// "don't take them off our site"). Portalled to <body> so a transformed
// ancestor (scroll fade-ins) can't trap the fixed overlay.

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { zeffyEmbedUrl } from "@/lib/giving-links";

export function ZeffyGive({
  url,
  title,
  className = "",
  children,
}: {
  url: string;
  title: string;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-6"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <div
              className="relative bg-white w-full max-w-xl h-[88svh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-3 border-b border-card-border">
                <p className="font-extrabold text-charcoal">{title}</p>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-full hover:bg-cream" aria-label="Close">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <iframe
                title={`${title} — secure checkout`}
                src={zeffyEmbedUrl(url)}
                className="flex-1 w-full border-0"
                allow="payment"
              />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
