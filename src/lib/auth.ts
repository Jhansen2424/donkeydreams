import { createNeonAuth } from "@neondatabase/auth/next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

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

// ── Read-only session getter for layouts/server components ──
//
// `auth.getSession()` writes cookies (to refresh near-expiry sessions),
// which Next.js forbids inside layouts and pure server components. This
// helper instead reads the SDK's signed session-data cookie directly and
// verifies it with the same secret the SDK uses — no cookie writes.
//
// The cookie is minted by /api/auth/get-session (which runs in a route
// handler that IS allowed to write cookies), so as long as the middleware
// pinged that path on this request, the cookie is fresh.

const SESSION_DATA_COOKIE_NAME = "__Secure-neon-auth.local.session_data";

interface MinimalSession {
  user: { id: string; email: string | null; name: string | null };
}

export async function getSessionReadOnly(): Promise<MinimalSession | null> {
  try {
    const store = await cookies();
    const raw = store.get(SESSION_DATA_COOKIE_NAME)?.value;
    if (!raw) return null;
    const secret = process.env.NEON_AUTH_COOKIE_SECRET;
    if (!secret) return null;
    const { payload } = await jwtVerify(raw, new TextEncoder().encode(secret));
    const user = (payload as { user?: { id?: string; email?: string; name?: string } }).user;
    if (!user?.id) return null;
    return {
      user: {
        id: user.id,
        email: user.email ?? null,
        name: user.name ?? null,
      },
    };
  } catch {
    // Cookie missing, expired, or signature mismatch — treat as no session.
    return null;
  }
}
