"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";

// Tiny toast system — built specifically to surface async dispatch failures
// (Joshy's on-demand-lookup actions) to the user after the QuickInput modal
// has already closed. Three severities; toasts auto-dismiss after 5 seconds.

type ToastKind = "success" | "error" | "info";

interface Toast {
  id: string;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  toast: (kind: ToastKind, message: string) => void;
  toastSuccess: (message: string) => void;
  toastError: (message: string) => void;
  toastInfo: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (kind: ToastKind, message: string) => {
      const id = `toast-${nextId++}`;
      setToasts((prev) => [...prev, { id, kind, message }]);
      setTimeout(() => dismiss(id), 5000);
    },
    [dismiss]
  );

  const toastSuccess = useCallback((m: string) => toast("success", m), [toast]);
  const toastError = useCallback((m: string) => toast("error", m), [toast]);
  const toastInfo = useCallback((m: string) => toast("info", m), [toast]);

  return (
    <ToastContext.Provider
      value={{ toast, toastSuccess, toastError, toastInfo }}
    >
      {children}
      {/* Toast stack — bottom-right, doesn't block any UI */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-2 px-4 py-3 rounded-lg shadow-lg border text-sm ${
              t.kind === "error"
                ? "bg-red-50 border-red-300 text-red-800"
                : t.kind === "success"
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                  : "bg-sky-50 border-sky-300 text-sky-800"
            }`}
            role="status"
          >
            {t.kind === "error" ? (
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            ) : t.kind === "success" ? (
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            ) : null}
            <p className="flex-1 font-medium leading-snug">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="text-warm-gray/60 hover:text-charcoal shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return ctx;
}
