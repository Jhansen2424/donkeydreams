import { LogOut } from "lucide-react";
import { signOutAction } from "@/lib/auth-actions";

// Plain sign-out button. Renders inside the dashboard sidebar, which is a
// pure server-side region — no NeonAuthUIProvider needed here. The button
// triggers a server action that revokes the session and redirects.
export default function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-cream/70 hover:bg-sidebar-light hover:text-white transition-colors"
      >
        <LogOut className="w-[18px] h-[18px] shrink-0" />
        <span className="flex-1 text-left">Sign out</span>
      </button>
    </form>
  );
}
