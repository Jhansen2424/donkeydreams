"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// Server action — called from the sidebar's sign-out form. Revokes the
// current session on the Neon Auth server (clears the cookie too via the
// SDK's internal handling) and bounces back to the sign-in page.
export async function signOutAction() {
  try {
    await auth.signOut();
  } catch (err) {
    // If revoke fails for some reason (network blip, server hiccup) we still
    // redirect — the user clicked "sign out" and they shouldn't be stuck
    // staring at the dashboard. The next request will fail the session check
    // and rebounce them to sign-in anyway.
    console.error("Sign-out revoke failed (continuing anyway):", err);
  }
  redirect("/auth/sign-in");
}
