"use client";

import Image from "next/image";
import { useState, useSyncExternalStore } from "react";

// Donkey photos load last (client 11/9: the yard's cell signal is poor, so
// profiles and lists should show their text first). Every photo waits until
// the page has finished loading, the donkey data has arrived (so each card
// downloads its final photo once, not the built-in one and then the
// uploaded one) and the browser is idle; then it loads lazily (only when
// near the screen) at low priority. A soft placeholder holds its space.
//
// Built-in photos (/donkeys/...) go through Next's image resizing, so a phone
// gets a small WebP sized for the spot instead of the original file (some
// are 2 MB+ PNGs). Photos uploaded in the app come from /api/animals/photo,
// are already small, and are cached on the phone after the first view.

let ready = false;
let started = false;
let dataReady = false;
let dataWaiter: (() => void) | null = null;
const listeners = new Set<() => void>();

/** Called by the animals data once it has arrived (or failed); photos may
 *  start after that. */
export function markPhotoDataReady() {
  dataReady = true;
  dataWaiter?.();
}

function markReady() {
  if (ready) return;
  ready = true;
  listeners.forEach((l) => l());
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  const idle = () => {
    const ric = (window as Window & { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => void })
      .requestIdleCallback;
    if (ric) ric(markReady, { timeout: 2500 });
    else setTimeout(markReady, 300);
  };
  const afterData = () => {
    if (dataReady) return idle();
    dataWaiter = idle;
    // Pages without donkey data (or a very slow load) still get photos.
    setTimeout(idle, 8000);
  };
  if (document.readyState === "complete") afterData();
  else window.addEventListener("load", afterData, { once: true });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!ready) start();
  return () => listeners.delete(cb);
}

/** True once the page has loaded and gone idle (stays true afterwards). */
export function usePhotosReady(): boolean {
  return useSyncExternalStore(subscribe, () => ready, () => false);
}

const resizable = (src: string) => src.startsWith("/") && !src.startsWith("/api/");

export default function DonkeyPhoto({
  src,
  alt,
  sizes,
  className = "",
}: {
  src: string;
  alt: string;
  /** How wide the photo shows, for picking a size, e.g. "(min-width: 768px) 25vw, 50vw". */
  sizes: string;
  /** Applied to the image (it always fills its box; the box must be `relative`). */
  className?: string;
}) {
  const photosReady = usePhotosReady();
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const fade = `transition-[opacity,transform] duration-500 ${loaded ? "opacity-100" : "opacity-0"}`;

  if (failed) {
    return (
      <span role="img" aria-label={alt} className="absolute inset-0 flex items-center justify-center bg-cream text-4xl">
        🫏
      </span>
    );
  }
  return (
    <>
      {!loaded && <span aria-hidden className="absolute inset-0 bg-cream animate-pulse" />}
      {photosReady &&
        (resizable(src) ? (
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            loading="lazy"
            fetchPriority="low"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={`object-cover ${fade} ${className}`}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={`absolute inset-0 w-full h-full object-cover ${fade} ${className}`}
          />
        ))}
    </>
  );
}
