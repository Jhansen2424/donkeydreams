"use client";

import { NeonAuthUIProvider } from "@neondatabase/auth/react/ui";
import { authClient } from "@/lib/auth-client";

// Client-only wrapper around <NeonAuthUIProvider>. Scoped to /auth/* only —
// the dashboard at /app deliberately does NOT mount this, since wrapping the
// app in this provider has broken the dashboard layout in prior attempts.
// The dashboard reads sessions server-side via auth.getSession() instead.
export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NeonAuthUIProvider authClient={authClient}>{children}</NeonAuthUIProvider>
  );
}
