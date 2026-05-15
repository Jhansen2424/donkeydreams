"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";

// Simple, dependency-light sign-out button. We previously rendered the SDK's
// <UserButton /> here, but it pulls in a theme/popover stack that throws
// silently inside our dark sidebar and takes the whole sidebar subtree with
// it. This is the boring, reliable replacement.
export default function SignOutButton() {
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await authClient.signOut();
    } finally {
      // Force a hard navigation so the middleware sees the cleared cookie.
      window.location.href = "/auth/sign-in";
    }
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={signingOut}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-cream/70 hover:bg-sidebar-light hover:text-white transition-colors disabled:opacity-50"
    >
      <LogOut className="w-[18px] h-[18px] shrink-0" />
      <span className="flex-1 text-left">{signingOut ? "Signing out…" : "Sign out"}</span>
    </button>
  );
}
