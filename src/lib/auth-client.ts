"use client";

import { createAuthClient } from "@neondatabase/auth";
import { BetterAuthReactAdapter } from "@neondatabase/auth/react/adapters";

// Browser-side Neon Auth client. The /api/auth/* catch-all (see
// app/api/auth/[...path]/route.ts) is the local proxy that forwards to the
// Neon Auth server using our cookie secret, so the client only ever talks
// to our own origin.
export const authClient = createAuthClient("/api/auth", {
  adapter: BetterAuthReactAdapter(),
});
