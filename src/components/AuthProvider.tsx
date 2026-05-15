"use client";

import { NeonAuthUIProvider } from "@neondatabase/auth/react/ui";
import { authClient } from "@/lib/auth-client";

// Client-only wrapper around <NeonAuthUIProvider>. Keeps the root layout a
// server component while still providing the auth context to every page
// (sign-in form, UserButton, useAuthData hook, etc.).
export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NeonAuthUIProvider authClient={authClient}>{children}</NeonAuthUIProvider>
  );
}
