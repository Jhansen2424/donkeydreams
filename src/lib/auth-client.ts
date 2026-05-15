"use client";

import { createAuthClient } from "@neondatabase/auth";
import { BetterAuthReactAdapter } from "@neondatabase/auth/react/adapters";

// Browser-side Neon Auth client. The /api/auth/* catch-all (see
// app/api/auth/[...path]/route.ts) is the local proxy that forwards to the
// Neon Auth server using our cookie secret, so the client only ever talks
// to our own origin.
//
// The SDK validates the URL eagerly (new URL()) at module load. That breaks
// Next.js's static prerender pass since a bare path like "/api/auth" isn't a
// valid URL on the server. We resolve to:
//   - browser     → window.location.origin + /api/auth
//   - build/SSR   → process.env.NEXT_PUBLIC_APP_URL or Vercel's VERCEL_URL
//   - last resort → localhost (development fallback only — prerender uses it
//                   to build the URL object; real requests run client-side)
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
