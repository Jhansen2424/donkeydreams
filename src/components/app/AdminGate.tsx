"use client";

import { useState, useSyncExternalStore } from "react";
import { Lock } from "lucide-react";

// Simple client-side PIN gate for the admin screens. Not security, just UI
// visibility. Once unlocked it stays unlocked for this browser session, so
// moving between Admin and its Admin Tasks page doesn't ask again.

const KEY = "dd:admin-unlocked";

function readUnlocked(): boolean {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}
function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

export function useAdminAccess() {
  const remembered = useSyncExternalStore(subscribe, readUnlocked, () => false);
  const [unlockedNow, setUnlockedState] = useState<boolean | null>(null);
  const unlocked = unlockedNow ?? remembered;
  const [pin, setPin] = useState("");
  const setUnlocked = (v: boolean) => {
    setUnlockedState(v);
    try {
      if (v) sessionStorage.setItem(KEY, "1");
      else sessionStorage.removeItem(KEY);
    } catch {}
  };
  return { unlocked, setUnlocked, pin, setPin };
}

export function AdminGate({
  children,
  unlocked,
  pin,
  setPin,
  setUnlocked,
}: {
  children: React.ReactNode;
  unlocked: boolean;
  pin: string;
  setPin: (v: string) => void;
  setUnlocked: (v: boolean) => void;
}) {
  // Simple PIN gate — "1234" placeholder. In real app, proper auth.
  const ADMIN_PIN = "1234";

  function handleUnlock() {
    if (pin === ADMIN_PIN) {
      setUnlocked(true);
    }
  }

  if (unlocked) return <>{children}</>;

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-white rounded-xl border border-card-border p-8 max-w-sm w-full text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-sidebar/10 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7 text-sidebar" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-charcoal">Admin Access Required</h2>
          <p className="text-sm text-warm-gray mt-1">
            Admin panel is restricted to Edj and Amber.
          </p>
        </div>
        <div className="space-y-3">
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            placeholder="Enter admin PIN"
            className="w-full px-4 py-3 text-center text-lg tracking-widest border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50 focus:border-sand"
            autoFocus
          />
          <button
            onClick={handleUnlock}
            className="w-full px-4 py-3 bg-sidebar text-white rounded-lg text-sm font-medium hover:bg-sidebar-light transition-colors"
          >
            Unlock
          </button>
        </div>
        {pin.length > 0 && pin !== ADMIN_PIN && (
          <p className="text-xs text-red-500">Incorrect PIN</p>
        )}
      </div>
    </div>
  );
}
