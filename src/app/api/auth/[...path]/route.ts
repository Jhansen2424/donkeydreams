import { auth } from "@/lib/auth";

// Auth API catch-all. The Neon Auth SDK speaks Better Auth's REST protocol
// (sign-in, sign-up, get-session, sign-out, password reset, etc.) and the
// AuthView UI calls these endpoints under /api/auth/*. The handler() proxies
// every request to the Neon Auth server using our configured baseUrl + cookie
// secret so the browser only ever talks to our own origin.
export const { GET, POST } = auth.handler();
