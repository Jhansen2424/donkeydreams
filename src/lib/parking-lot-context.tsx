"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type EntryType =
  | "task"
  | "medical"
  | "feed"
  | "watch"
  | "note"
  | "update"
  | "reminder"
  | "developer"; // bug reports / feature requests / questions for the dev team

export interface ParkingLotEntry {
  id: string;
  type: EntryType;
  text: string;
  timestamp: Date;
  resolved: boolean;
  data?: {
    animal?: string;
    timeBlock?: string;
    assignee?: string;
    severity?: "high" | "medium" | "low";
    title?: string;
    date?: string;
    /** Feed-notes sub-category. Only used when `type === "feed"`. */
    category?: "daily" | "ongoing" | "evergreen";
  };
}

interface ParkingLotContextValue {
  entries: ParkingLotEntry[];
  addEntry: (type: EntryType, text: string, data?: ParkingLotEntry["data"]) => Promise<void>;
  updateEntry: (
    id: string,
    patch: { type?: EntryType; text?: string; data?: ParkingLotEntry["data"] }
  ) => Promise<void>;
  resolveEntry: (id: string) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  unresolvedCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const ParkingLotContext = createContext<ParkingLotContextValue | null>(null);

// API payload → in-memory shape (timestamp is a Date object locally).
interface ApiEntry {
  id: string;
  type: string;
  text: string;
  timestamp: string;
  resolved: boolean;
  data?: ParkingLotEntry["data"];
}
function fromApi(e: ApiEntry): ParkingLotEntry {
  return {
    id: e.id,
    type: e.type as EntryType,
    text: e.text,
    timestamp: new Date(e.timestamp),
    resolved: e.resolved,
    data: e.data,
  };
}

export function ParkingLotProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<ParkingLotEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/parking-lot", { cache: "no-store" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
      const body = (await res.json()) as { entries: ApiEntry[] };
      setEntries(body.entries.map(fromApi));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load notes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Optimistic create: show immediately with a temp id, then reconcile with
  // the server-issued id. If the server rejects, roll back.
  const addEntry = useCallback(
    async (type: EntryType, text: string, data?: ParkingLotEntry["data"]) => {
      const tempId = `pl-temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const optimistic: ParkingLotEntry = {
        id: tempId,
        type,
        text,
        timestamp: new Date(),
        resolved: false,
        data,
      };
      setEntries((prev) => [optimistic, ...prev]);

      try {
        const res = await fetch("/api/parking-lot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, text, data }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed to save");
        const body = (await res.json()) as { entry: ApiEntry };
        const saved = fromApi(body.entry);
        setEntries((prev) => prev.map((e) => (e.id === tempId ? saved : e)));
      } catch (e) {
        setEntries((prev) => prev.filter((e) => e.id !== tempId));
        setError(e instanceof Error ? e.message : "Failed to save note");
      }
    },
    []
  );

  const updateEntry = useCallback(
    async (
      id: string,
      patch: { type?: EntryType; text?: string; data?: ParkingLotEntry["data"] }
    ) => {
      // Optimistic update; revert on failure.
      const snapshot = entries;
      setEntries((prev) =>
        prev.map((e) =>
          e.id === id
            ? {
                ...e,
                type: patch.type ?? e.type,
                text: patch.text ?? e.text,
                data: patch.data ?? e.data,
              }
            : e
        )
      );
      try {
        const res = await fetch("/api/parking-lot", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...patch }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed to update");
      } catch (e) {
        setEntries(snapshot);
        setError(e instanceof Error ? e.message : "Failed to update note");
      }
    },
    [entries]
  );

  const resolveEntry = useCallback(async (id: string) => {
    // Optimistic mark-resolved; revert on failure.
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, resolved: true } : e)));
    try {
      const res = await fetch("/api/parking-lot", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, resolved: true }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to update");
    } catch (e) {
      setEntries((prev) => prev.map((x) => (x.id === id ? { ...x, resolved: false } : x)));
      setError(e instanceof Error ? e.message : "Failed to update note");
    }
  }, []);

  const removeEntry = useCallback(async (id: string) => {
    // Optimistic remove; restore on failure.
    const snapshot = entries;
    setEntries((prev) => prev.filter((e) => e.id !== id));
    try {
      const res = await fetch(`/api/parking-lot?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to delete");
    } catch (e) {
      setEntries(snapshot);
      setError(e instanceof Error ? e.message : "Failed to delete note");
    }
  }, [entries]);

  const unresolvedCount = entries.filter((e) => !e.resolved).length;

  return (
    <ParkingLotContext.Provider
      value={{ entries, addEntry, updateEntry, resolveEntry, removeEntry, unresolvedCount, loading, error, refresh }}
    >
      {children}
    </ParkingLotContext.Provider>
  );
}

export function useParkingLot() {
  const ctx = useContext(ParkingLotContext);
  if (!ctx) throw new Error("useParkingLot must be used within ParkingLotProvider");
  return ctx;
}
