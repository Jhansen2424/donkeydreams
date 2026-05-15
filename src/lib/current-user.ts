import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// Look up the Volunteer row corresponding to the signed-in user. Match is
// done by email (case-insensitive). Returns null when no session, no
// matching volunteer, or the email isn't on the allowlist. Use this anywhere
// you need the "logged-in person's full profile" — not just their auth email.
//
// Designed for server components / route handlers; not safe in middleware
// (middleware can't `await db.*`).
export async function getCurrentVolunteer() {
  const { data: session } = await auth.getSession();
  const email = session?.user?.email?.toLowerCase();
  if (!email) return null;
  // Postgres email column is case-sensitive; we lowercased it during seed.
  // If a future seed inserts mixed-case emails, we'd want a `mode: "insensitive"`
  // filter here. For now exact match is fine.
  return db.volunteer.findUnique({ where: { email } });
}

// Convenience — the auth user (no Volunteer JOIN). Use when you just need
// the signed-in email/name, not the full profile.
export async function getCurrentAuthUser() {
  const { data: session } = await auth.getSession();
  return session?.user ?? null;
}
