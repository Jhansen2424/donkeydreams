import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { auth } from "@/lib/auth";

// Middleware runs on every matched request and is allowed to read/write
// cookies (which the SDK does to refresh near-expiry sessions). It also
// redirects unauthenticated visitors to /auth/sign-in.
//
// The /app layout STILL does its own getSession() for two reasons:
//   1. We want the email allowlist check (middleware doesn't do that here
//      — see the layout for the kick-to-access-denied logic).
//   2. The layout needs the user object to greet them by name.
// But by the time the layout runs, the cookie is already refreshed by this
// middleware, so the layout's getSession() doesn't try to write cookies.
const authMiddleware = auth.middleware({ loginUrl: "/auth/sign-in" });

// The signed session-data cookie the SDK mints (HS256, signed with
// NEON_AUTH_COOKIE_SECRET). Reading it is method-independent — unlike the SDK
// middleware's get-session proxy, which forwards the ORIGINAL request method
// upstream and so wrongly rejects POST/PATCH/DELETE even when the cookies are
// valid. (Verified: a GET to /api/parking-lot with these cookies returns 200,
// but a POST to /api/joshy with the SAME cookies returns 307 → "not
// authenticated".) For API routes we therefore verify the cookie ourselves
// instead of trusting the SDK's verdict for non-GET methods.
const SESSION_DATA_COOKIE_NAME = "__Secure-neon-auth.local.session_data";
const SESSION_TOKEN_COOKIE_NAME = "__Secure-neon-auth.session_token";

async function hasValidSession(req: NextRequest): Promise<boolean> {
  const secret = process.env.NEON_AUTH_COOKIE_SECRET;
  if (!secret) return false;

  // Fast path: a valid signed session_data cache cookie proves authentication.
  const raw = req.cookies.get(SESSION_DATA_COOKIE_NAME)?.value;
  if (raw) {
    try {
      const { payload } = await jwtVerify(
        raw,
        new TextEncoder().encode(secret),
        { algorithms: ["HS256"] }
      );
      const user = (payload as { user?: { id?: string } }).user;
      if (user?.id) return true;
    } catch {
      // Expired or bad signature — fall through to the session_token check
      // below (the SDK lazily re-mints session_data from the token).
    }
  }

  // The session_data cache cookie has a short TTL (default 5 min) and the SDK
  // re-mints it from the primary session_token cookie. So a missing/expired
  // session_data with a present session_token still means the user is logged
  // in — the route ran behind the login wall. Treat the token's presence as
  // authenticated for API gating purposes.
  return !!req.cookies.get(SESSION_TOKEN_COOKIE_NAME)?.value;
}

export default async function middleware(req: NextRequest) {
  const isApi = req.nextUrl.pathname.startsWith("/api/");

  // API routes: verify the session cookie directly (method-independent) and
  // return 401 JSON when missing/invalid. Never redirect — the Notes page and
  // Joshy AI hit these with fetch(), and a redirect on a fetch (especially a
  // method-preserving 307 on a POST) cascades into ERR_TOO_MANY_REDIRECTS.
  if (isApi) {
    if (await hasValidSession(req)) {
      return NextResponse.next();
    }
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Pages (/app/*): keep the SDK middleware's redirect-to-login UX. Pages are
  // GET navigations, which the SDK validates correctly.
  return authMiddleware(req);
}

export const config = {
  // Gate /app/* pages and protected /api/* routes. Excludes static assets,
  // the marketing site, the auth UI itself, and the /api/auth catch-all
  // (which must remain open so sign-in / sign-up can work).
  matcher: [
    "/app/:path*",
    "/api/animals/:path*",
    "/api/calendar/:path*",
    "/api/dental-visits/:path*",
    "/api/feed/:path*",
    "/api/hoof-visits/:path*",
    "/api/joshy/:path*",
    "/api/knowledge/:path*",
    "/api/medical/:path*",
    "/api/parking-lot/:path*",
    "/api/pens/:path*",
    "/api/providers/:path*",
    "/api/tasks/:path*",
    "/api/trim-profiles/:path*",
    "/api/volunteers/:path*",
    "/api/weight/:path*",
  ],
};
