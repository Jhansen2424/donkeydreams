"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type EntryType = "task" | "medical" | "feed" | "watch" | "note";

export interface ParkingLotEntry {
  id: string;
  type: EntryType;
  text: string;
  timestamp: Date;
  resolved: boolean;
  // Structured data from quick forms
  data?: {
    animal?: string;
    timeBlock?: string;
    assignee?: string;
    severity?: "high" | "medium" | "low";
    title?: string;
    date?: string;
  };
}

interface ParkingLotContextValue {
  entries: ParkingLotEntry[];
  addEntry: (type: EntryType, text: string, data?: ParkingLotEntry["data"]) => void;
  resolveEntry: (id: string) => void;
  removeEntry: (id: string) => void;
  unresolvedCount: number;
}

const ParkingLotContext = createContext<ParkingLotContextValue | null>(null);

export function ParkingLotProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<ParkingLotEntry[]>([]);

  const addEntry = useCallback(
    (type: EntryType, text: string, data?: ParkingLotEntry["data"]) => {
      const entry: ParkingLotEntry = {
        id: `pl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type,
        text,
        timestamp: new Date(),
        resolved: false,
        data,
      };
      setEntries((prev) => [entry, ...prev]);
    },
    []
  );

  const resolveEntry = useCallback((id: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, resolved: true } : e))
    );
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const unresolvedCount = entries.filter((e) => !e.resolved).length;

  return (
    <ParkingLotContext.Provider
      value={{ entries, addEntry, resolveEntry, removeEntry, unresolvedCount }}
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
