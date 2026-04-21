"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { MedicalEntry, MedicalEntryType } from "./medical-data";

// Fields a caller can provide when creating an entry. `id` is server-issued.
export type NewMedicalEntry = {
  animal: string;
  type: MedicalEntryType;
  title: string;
  date: string;
  description?: string;
  urgent?: boolean;
  provider?: string;
};

// Fields a caller can patch. `id` identifies the target.
export type MedicalEntryPatch = Partial<NewMedicalEntry>;

interface MedicalContextValue {
  entries: MedicalEntry[];
  addEntry: (input: NewMedicalEntry) => Promise<MedicalEntry | null>;
  updateEntry: (id: string, patch: MedicalEntryPatch) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const MedicalContext = createContext<MedicalContextValue | null>(null);

interface ApiEntry {
  id: string;
  animal: string;
  type: string;
  title: string;
  date: string;
  description: string;
  urgent: boolean;
  provider?: string;
}

function fromApi(e: ApiEntry): MedicalEntry {
  return {
    id: e.id,
    animal: e.animal,
    type: e.type as MedicalEntryType,
    title: e.title,
    date: e.date,
    description: e.description,
    urgent: e.urgent,
    provider: e.provider ?? "",
  };
}

export function MedicalProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<MedicalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/medical", { cache: "no-store" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
      const body = (await res.json()) as { entries: ApiEntry[] };
      setEntries(body.entries.map(fromApi));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load medical entries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Optimistic create: show immediately with a temp id, then reconcile with
  // the server-issued id. Roll back on failure.
  const addEntry = useCallback(
    async (input: NewMedicalEntry): Promise<MedicalEntry | null> => {
      const tempId = `med-temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const optimistic: MedicalEntry = {
        id: tempId,
        animal: input.animal,
        type: input.type,
        title: input.title,
        date: input.date,
        description: input.description ?? "",
        urgent: Boolean(input.urgent),
        provider: input.provider ?? "",
      };
      setEntries((prev) => [optimistic, ...prev]);

      try {
        const res = await fetch("/api/medical", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed to save");
        const body = (await res.json()) as { entry: ApiEntry };
        const saved = fromApi(body.entry);
        setEntries((prev) => prev.map((e) => (e.id === tempId ? saved : e)));
        return saved;
      } catch (e) {
        setEntries((prev) => prev.filter((e) => e.id !== tempId));
        setError(e instanceof Error ? e.message : "Failed to save medical entry");
        return null;
      }
    },
    []
  );

  const updateEntry = useCallback(
    async (id: string, patch: MedicalEntryPatch) => {
      const snapshot = entries;
      setEntries((prev) =>
        prev.map((e) =>
          e.id === id
            ? {
                ...e,
                animal: patch.animal ?? e.animal,
                type: patch.type ?? e.type,
                title: patch.title ?? e.title,
                date: patch.date ?? e.date,
                description: patch.description ?? e.description,
                urgent: patch.urgent ?? e.urgent,
                provider: patch.provider ?? e.provider,
              }
            : e
        )
      );
      try {
        const res = await fetch("/api/medical", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...patch }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed to update");
      } catch (e) {
        setEntries(snapshot);
        setError(e instanceof Error ? e.message : "Failed to update medical entry");
      }
    },
    [entries]
  );

  const removeEntry = useCallback(
    async (id: string) => {
      const snapshot = entries;
      setEntries((prev) => prev.filter((e) => e.id !== id));
      try {
        const res = await fetch(`/api/medical?id=${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed to delete");
      } catch (e) {
        setEntries(snapshot);
        setError(e instanceof Error ? e.message : "Failed to delete medical entry");
      }
    },
    [entries]
  );

  return (
    <MedicalContext.Provider
      value={{ entries, addEntry, updateEntry, removeEntry, loading, error, refresh }}
    >
      {children}
    </MedicalContext.Provider>
  );
}

export function useMedical() {
  const ctx = useContext(MedicalContext);
  if (!ctx) throw new Error("useMedical must be used within MedicalProvider");
  return ctx;
}
