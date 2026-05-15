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
export default auth.middleware({ loginUrl: "/auth/sign-in" });

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
