"use client";

// Live animal roster for the /app pages.
//
// The CSV-baked module (src/lib/animals.ts) is the base roster; this context
// overlays the DB's app-editable fields on top (herd, status, photos, notes,
// …) and appends animals created in-app, so profile edits, herd moves, and
// New Animal actually display without a rebuild. The public site keeps using
// the static module directly.
//
// Herds: the canonical static list, plus any distinct herd names found on DB
// rows, plus names created this session via createHerd (a herd becomes
// permanent the moment an animal is saved into it — there is no Herd table).

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { animals as staticAnimals, herds as staticHerds, type Animal } from "./animals";

// The DB fields the app can edit (mirrors EDITABLE in /api/animals) plus the
// identity fields needed to display DB-only animals.
interface ApiAnimal {
  name: string;
  slug: string;
  age: string;
  sex: string;
  size: string | null;
  color: string | null;
  origin: string;
  status: string;
  herd: string;
  pen: string;
  tagline: string;
  story: string[];
  sponsorable: boolean;
  intakeDate: string;
  adoptedFrom: string;
  behavioralNotes: string;
  traits: string[];
  bestFriends: string[];
  parents: string[];
  children: string[];
  profileImage: string | null;
  galleryImages: string[];
  nextHoofDue: string | null;
  nextDentalDue: string | null;
}

export type AnimalPatch = Partial<
  Pick<
    Animal,
    | "herd"
    | "pen"
    | "status"
    | "sex"
    | "size"
    | "color"
    | "tagline"
    | "traits"
    | "story"
    | "bestFriends"
    | "parents"
    | "children"
    | "behavioralNotes"
    | "sponsorable"
    | "profileImage"
    | "galleryImages"
    | "adoptedFrom"
    | "nextHoofDue"
    | "nextDentalDue"
  >
>;

export interface NewAnimalInput {
  name: string;
  herd: string;
  sex?: string;
  age?: string;
  origin?: string;
  intakeDate?: string;
}

interface AnimalsContextValue {
  animals: Animal[];
  herds: string[];
  getBySlug: (slug: string) => Animal | undefined;
  updateAnimal: (name: string, patch: AnimalPatch) => Promise<boolean>;
  createAnimal: (input: NewAnimalInput) => Promise<boolean>;
  createHerd: (name: string) => void;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const AnimalsContext = createContext<AnimalsContextValue | null>(null);

function overlay(base: Animal, row: ApiAnimal): Animal {
  return {
    ...base,
    status: row.status,
    sex: row.sex || base.sex,
    size: row.size ?? base.size,
    color: row.color ?? base.color,
    herd: row.herd,
    pen: row.pen,
    tagline: row.tagline,
    traits: row.traits,
    story: row.story,
    bestFriends: row.bestFriends,
    parents: row.parents,
    children: row.children,
    behavioralNotes: row.behavioralNotes,
    sponsorable: row.sponsorable,
    profileImage: row.profileImage ?? base.profileImage,
    galleryImages: row.galleryImages.length ? row.galleryImages : base.galleryImages,
    adoptedFrom: row.adoptedFrom || base.adoptedFrom,
    nextHoofDue: row.nextHoofDue,
    nextDentalDue: row.nextDentalDue,
  };
}

function fromDbOnly(row: ApiAnimal): Animal {
  return {
    name: row.name,
    slug: row.slug,
    age: row.age === "Unknown" ? "" : row.age,
    sex: row.sex,
    origin: row.origin,
    status: row.status,
    herd: row.herd,
    pen: row.pen,
    tags: [],
    traits: row.traits,
    bestFriends: row.bestFriends,
    parents: row.parents,
    children: row.children,
    profileImage: row.profileImage ?? undefined,
    galleryImages: row.galleryImages,
    tagline: row.tagline,
    story: row.story,
    sponsorable: row.sponsorable,
    intakeDate: row.intakeDate,
    adoptedFrom: row.adoptedFrom,
    behavioralNotes: row.behavioralNotes,
    medicalRecords: [],
    tasks: [],
    size: row.size ?? undefined,
    color: row.color ?? undefined,
    nextHoofDue: row.nextHoofDue,
    nextDentalDue: row.nextDentalDue,
  };
}

export function AnimalsProvider({ children }: { children: ReactNode }) {
  const [dbRows, setDbRows] = useState<ApiAnimal[]>([]);
  const [extraHerds, setExtraHerds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/animals", { cache: "no-store" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
      const body = (await res.json()) as { animals: ApiAnimal[] };
      setDbRows(body.animals);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load animals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const animals = useMemo(() => {
    const byName = new Map(dbRows.map((r) => [r.name, r]));
    const merged = staticAnimals.map((a) => {
      const row = byName.get(a.name);
      if (!row) return a;
      byName.delete(a.name);
      return overlay(a, row);
    });
    // Animals that exist only in the DB (created via New Animal)
    for (const row of byName.values()) merged.push(fromDbOnly(row));
    return merged.sort((a, b) => a.name.localeCompare(b.name));
  }, [dbRows]);

  const herds = useMemo(() => {
    const set = new Set<string>(staticHerds);
    for (const r of dbRows) if (r.herd) set.add(r.herd);
    for (const h of extraHerds) set.add(h);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [dbRows, extraHerds]);

  const getBySlug = useCallback(
    (slug: string) => animals.find((a) => a.slug === slug),
    [animals]
  );

  const updateAnimal = useCallback(
    async (name: string, patch: AnimalPatch): Promise<boolean> => {
      const snapshot = dbRows;
      setDbRows((prev) =>
        prev.map((r) => (r.name === name ? ({ ...r, ...patch } as ApiAnimal) : r))
      );
      try {
        const res = await fetch("/api/animals", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, ...patch }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed to save");
        return true;
      } catch (e) {
        setDbRows(snapshot);
        setError(e instanceof Error ? e.message : "Failed to save animal");
        return false;
      }
    },
    [dbRows]
  );

  const createAnimal = useCallback(
    async (input: NewAnimalInput): Promise<boolean> => {
      try {
        const res = await fetch("/api/animals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed to create");
        await refresh();
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to create animal");
        return false;
      }
    },
    [refresh]
  );

  const createHerd = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setExtraHerds((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
  }, []);

  return (
    <AnimalsContext.Provider
      value={{
        animals,
        herds,
        getBySlug,
        updateAnimal,
        createAnimal,
        createHerd,
        loading,
        error,
        refresh,
      }}
    >
      {children}
    </AnimalsContext.Provider>
  );
}

export function useAnimals() {
  const ctx = useContext(AnimalsContext);
  if (!ctx) throw new Error("useAnimals must be used within AnimalsProvider");
  return ctx;
}
