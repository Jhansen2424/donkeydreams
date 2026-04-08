"use client";

import { useCallback, useEffect, useState } from "react";
import { Ear, EarOff, Mic } from "lucide-react";
import { format } from "date-fns";
import QuickInput from "@/components/app/QuickInput";
import WakeWordListener from "@/components/app/WakeWordListener";
import { useParkingLot } from "@/lib/parking-lot-context";

const WAKE_PREF_KEY = "joshy:wakeEnabled";

export default function TopBar() {
  const today = new Date();
  const greeting =
    today.getHours() < 12
      ? "Good morning"
      : today.getHours() < 17
        ? "Good afternoon"
        : "Good evening";

  const [quickInputOpen, setQuickInputOpen] = useState(false);
  const [autoVoice, setAutoVoice] = useState(false);
  const [wakeTail, setWakeTail] = useState("");
  const [wakeEnabled, setWakeEnabled] = useState(false);
  const [wakeError, setWakeError] = useState<string | null>(null);
  const { unresolvedCount } = useParkingLot();

  // Load wake-word preference from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    setWakeEnabled(window.localStorage.getItem(WAKE_PREF_KEY) === "1");
  }, []);

  const toggleWake = useCallback(() => {
    setWakeError(null);
    setWakeEnabled((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(WAKE_PREF_KEY, next ? "1" : "0");
      }
      return next;
    });
  }, []);

  const handleWake = useCallback((tail: string) => {
    setWakeTail(tail);
    setAutoVoice(true);
    setQuickInputOpen(true);
  }, []);

  const handleWakeError = useCallback((msg: string) => {
    setWakeError(msg);
    setWakeEnabled(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(WAKE_PREF_KEY, "0");
    }
  }, []);

  const handleModalClose = useCallback(() => {
    setQuickInputOpen(false);
    setAutoVoice(false);
    setWakeTail("");
  }, []);

  return (
    <>
      <header className="bg-white border-b border-card-border px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-charcoal">
              {greeting} 👋
            </h2>
            <p className="text-warm-gray text-sm mt-0.5">
              {format(today, "EEEE, MMMM d, yyyy")} · Scenic, AZ
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleWake}
              title={
                wakeEnabled
                  ? "Hey Joshy is listening — click to disable"
                  : "Enable 'Hey Joshy' wake word"
              }
              className={`relative inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
                wakeEnabled
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  : "bg-white text-warm-gray border-card-border hover:bg-cream"
              }`}
            >
              {wakeEnabled ? <Ear className="w-4 h-4" /> : <EarOff className="w-4 h-4" />}
              <span className="hidden sm:inline">
                {wakeEnabled ? "Hey Joshy: on" : "Hey Joshy"}
              </span>
              {wakeEnabled && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setQuickInputOpen(true)}
              className="relative inline-flex items-center gap-1.5 px-4 py-2.5 bg-sidebar text-white rounded-lg text-sm font-medium hover:bg-sidebar-light transition-colors"
            >
              <Mic className="w-4 h-4" />
              Add Note
              {unresolvedCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unresolvedCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {wakeError && (
          <p className="text-xs text-red-600 mt-2">{wakeError}</p>
        )}
      </header>

      {/* Background wake-word listener (paused while modal is open) */}
      <WakeWordListener
        enabled={wakeEnabled}
        paused={quickInputOpen}
        onWake={handleWake}
        onError={handleWakeError}
      />

      {/* Add Note Modal */}
      <QuickInput
        open={quickInputOpen}
        onClose={handleModalClose}
        autoVoice={autoVoice}
        initialText={wakeTail}
      />

      {/* Mobile floating action button */}
      <button
        onClick={() => setQuickInputOpen(true)}
        className="md:hidden fixed bottom-20 right-4 z-30 w-14 h-14 bg-sidebar text-white rounded-full shadow-lg flex items-center justify-center hover:bg-sidebar-light transition-colors active:scale-95"
        aria-label="Add Note"
      >
        <Mic className="w-6 h-6" />
        {unresolvedCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unresolvedCount}
          </span>
        )}
      </button>
    </>
  );
}
