"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

// Providers (farriers / equine dentists / vets). Backed by the DB via
// /api/providers. Kept in a context so Hoof/Dental and Medical pages share
// the same live list — add on one page, see the addition on the other.

export interface Provider {
  id: string;
  name: string;
  type: string; // "Farrier" | "Equine Dentist" | "Vet"
  phone: string;
  notes?: string;
}

interface ProvidersContextValue {
  providers: Provider[];
  loading: boolean;
  error: string | null;
  add: (p: { name: string; type: string; phone?: string }) => Promise<void>;
  update: (id: string, patch: Partial<Omit<Provider, "id">>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const ProvidersContext = createContext<ProvidersContextValue | null>(null);

export function ProvidersProvider({ children }: { children: ReactNode }) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/providers", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setProviders(data.providers ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load providers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const add = useCallback(
    async (p: { name: string; type: string; phone?: string }) => {
      const res = await fetch("/api/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: p.name,
          type: p.type,
          phone: p.phone ?? "",
        }),
      });
      if (res.ok) {
        const { provider } = await res.json();
        setProviders((prev) => {
          // Upsert into list: replace by name, else append.
          const idx = prev.findIndex((x) => x.name === provider.name);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = provider;
            return next;
          }
          return [...prev, provider].sort((a, b) =>
            a.name.localeCompare(b.name)
          );
        });
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body?.error ?? "Failed to save provider");
      }
    },
    []
  );

  const update = useCallback(
    async (id: string, patch: Partial<Omit<Provider, "id">>) => {
      const prev = providers;
      setProviders((cur) =>
        cur.map((p) => (p.id === id ? { ...p, ...patch } : p))
      );
      const res = await fetch("/api/providers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      if (!res.ok) {
        setProviders(prev);
        const body = await res.json().catch(() => ({}));
        setError(body?.error ?? "Failed to update provider");
      }
    },
    [providers]
  );

  const remove = useCallback(
    async (id: string) => {
      const prev = providers;
      setProviders((cur) => cur.filter((p) => p.id !== id));
      const res = await fetch(`/api/providers?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setProviders(prev);
        setError("Failed to delete provider");
      }
    },
    [providers]
  );

  return (
    <ProvidersContext.Provider
      value={{ providers, loading, error, add, update, remove, refresh }}
    >
      {children}
    </ProvidersContext.Provider>
  );
}

export function useProviders() {
  const ctx = useContext(ProvidersContext);
  if (!ctx) {
    throw new Error("useProviders must be used inside <ProvidersProvider>");
  }
  return ctx;
}
