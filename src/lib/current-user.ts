import { db } from "@/lib/db";
import { getSessionReadOnly } from "@/lib/auth";

// Look up the Volunteer row corresponding to the signed-in user. Match is
// done by email (case-insensitive). Returns null when no session, no
// matching volunteer, or the email isn't on the allowlist. Use this anywhere
// you need the "logged-in person's full profile" — not just their auth email.
//
// Uses the read-only session helper so it's safe to call from layouts and
// server components (auth.getSession() can't run there — it writes cookies).
export async function getCurrentVolunteer() {
  const session = await getSessionReadOnly();
  const email = session?.user?.email?.toLowerCase();
  if (!email) return null;
  return db.volunteer.findUnique({ where: { email } });
}

// Convenience — the auth user (no Volunteer JOIN). Use when you just need
// the signed-in email/name, not the full profile.
export async function getCurrentAuthUser() {
  const session = await getSessionReadOnly();
  return session?.user ?? null;
}
