import Link from "next/link";

// Shown when a signed-in user's email isn't on the allowlist. The /app
// layout redirects here so we don't leak the "your email is wrong" message
// to anonymous visitors who would just bounce to sign-in instead.
export default function AccessDeniedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream p-4">
      <div className="bg-white rounded-2xl border border-card-border p-8 max-w-md w-full text-center space-y-4 shadow-sm">
        <h1 className="text-2xl font-bold text-charcoal">Access denied</h1>
        <p className="text-sm text-warm-gray leading-relaxed">
          You&apos;re signed in, but this account isn&apos;t authorized to use
          the Donkey Dreams app yet. If you think this is a mistake, contact an
          admin.
        </p>
        <div className="flex flex-col gap-2 pt-2">
          <Link
            href="/auth/sign-out"
            className="px-4 py-2.5 bg-sidebar text-white rounded-lg text-sm font-medium hover:bg-sidebar-light transition-colors"
          >
            Sign out
          </Link>
          <Link
            href="/"
            className="px-4 py-2.5 bg-white border border-card-border text-charcoal rounded-lg text-sm font-medium hover:bg-cream transition-colors"
          >
            Back to homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
