import { createNeonAuth } from "@neondatabase/auth/next/server";

// Singleton Neon Auth client. Used by:
//   - middleware.ts (route protection + session refresh)
//   - app/api/auth/[...path]/route.ts (auth API catch-all proxy)
//   - server components that need to check who's signed in
//
// Two env vars:
//   NEON_AUTH_BASE_URL     — issued by Neon when you enable Auth on your project
//   NEON_AUTH_COOKIE_SECRET — 32+ char random string, MUST be identical across
//                             environments (local, preview, prod) or sessions
//                             get invalidated when crossing them.
export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
  },
});

// Hardcoded allowlist. Even if a stranger discovers the sign-up URL and creates
// an account, they can't reach /app — the layout 403s any email not on this list.
// Lowercase comparison to dodge case-sensitivity issues at the IDP boundary.
export const ALLOWED_EMAILS = new Set(
  [
    "joshua@webaholics.ai",
    "amber@donkeydreams.org",
    "theedj17@gmail.com",
  ].map((e) => e.toLowerCase())
);

export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ALLOWED_EMAILS.has(email.toLowerCase());
}
