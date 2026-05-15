"use client";

import { createAuthClient } from "@neondatabase/auth";
import { BetterAuthReactAdapter } from "@neondatabase/auth/react/adapters";

// Browser-side Neon Auth client. The /api/auth/* catch-all proxies to the
// Neon Auth server so the browser only ever talks to our own origin.
//
// The SDK eagerly validates the URL with `new URL()` at module load, so a
// bare path like "/api/auth" fails during static prerender. Resolve to:
//   - browser     → window.location.origin + /api/auth
//   - build/SSR   → NEXT_PUBLIC_APP_URL or Vercel's VERCEL_URL
//   - dev fallback → localhost:3000
function resolveBaseUrl(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/auth`;
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) return `${appUrl.replace(/\/$/, "")}/api/auth`;
  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}/api/auth`;
  return "http://localhost:3000/api/auth";
}

export const authClient = createAuthClient(resolveBaseUrl(), {
  adapter: BetterAuthReactAdapter(),
});
