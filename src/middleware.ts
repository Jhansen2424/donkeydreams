import { auth } from "@/lib/auth";

// Redirect unauthenticated requests to the sign-in page. The allowlist (only
// joshua@webaholics.ai, amber@donkeydreams.org, theedj17@gmail.com may use
// the app) is enforced separately in src/app/app/layout.tsx since the email
// check needs a parsed user object, not just "is there a session cookie".
export default auth.middleware({ loginUrl: "/auth/sign-in" });

export const config = {
  // Run on every request EXCEPT static assets, public marketing pages, the
  // auth UI itself (otherwise sign-in would redirect to sign-in), and the
  // auth API catch-all (proxied without auth so login/signup can succeed).
  //
  // Matched (gated): /app/*, /api/animals/*, /api/feed/*, /api/medical/*, etc.
  // Excluded:        /_next/static, /_next/image, /favicon.ico, /donkeys,
  //                  /donate, /our-story, /, /auth/*, /api/auth/*, public assets.
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
    "/api/providers/:path*",
    "/api/tasks/:path*",
    "/api/trim-profiles/:path*",
    "/api/volunteers/:path*",
    "/api/weight/:path*",
  ],
};
