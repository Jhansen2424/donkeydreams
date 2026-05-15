import AuthProvider from "@/components/AuthProvider";
import "@neondatabase/auth-ui/css";

// /auth/* shell. Mounts the NeonAuthUIProvider so AuthView / SignInForm etc.
// have the context they need. ONLY mounted here — NOT on /app — because the
// provider's theme + popover stack has broken the dashboard in prior tries.
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AuthProvider>{children}</AuthProvider>;
}
