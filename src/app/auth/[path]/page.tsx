import { redirect } from "next/navigation";
import { AuthView } from "@neondatabase/auth/react/ui";
import { authViewPaths } from "@neondatabase/auth/react/ui/server";
import { getSessionReadOnly } from "@/lib/auth";

// Single page serves every auth view (sign-in, sign-up, forgot-password,
// reset-password, email-otp, callback, etc.). `path` is the URL slug — the
// SDK's authViewPaths constant lists the canonical set we expose.

// Server component reads cookies — must be dynamic, not statically built.
export const dynamic = "force-dynamic";

// We previously had dynamicParams=false + generateStaticParams. Both are
// incompatible with the dynamic session check above. The AuthView itself
// only renders for the slugs the SDK knows about; unknown slugs just render
// an empty view, no harm done.

const VALID_PATHS = new Set(Object.values(authViewPaths));

// If `path` is one of the "post-login" views (sign-out, callback), don't
// short-circuit even if a session exists — the user explicitly wants to
// hit those flows. Sign-in and sign-up should bounce to /app instead.
const BOUNCE_IF_LOGGED_IN = new Set([
  authViewPaths.SIGN_IN,
  authViewPaths.SIGN_UP,
  authViewPaths.MAGIC_LINK,
  authViewPaths.FORGOT_PASSWORD,
  authViewPaths.EMAIL_OTP,
]);

export default async function AuthPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;

  // Unknown slug — return a 404-ish placeholder rather than rendering the
  // empty AuthView. (Better Auth doesn't surface an "unknown view" page.)
  if (!VALID_PATHS.has(path)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream p-4">
        <p className="text-sm text-warm-gray">Unknown auth page.</p>
      </main>
    );
  }

  // If they're already signed in and visiting a "log me in" view, jump
  // straight to /app. The /app layout will then enforce the allowlist.
  // Read-only path — pages can't modify cookies, so we read the SDK's
  // signed session-data cookie directly instead of calling auth.getSession().
  if (BOUNCE_IF_LOGGED_IN.has(path)) {
    const session = await getSessionReadOnly();
    if (session?.user) {
      redirect("/app");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream p-4">
      <div className="w-full max-w-md">
        <AuthView path={path} />
      </div>
    </main>
  );
}
