// Allowed values for the animal-profile dropdowns (Sex / Size / Color / Herd).
// Derived from existing data + canonical lists so authoring stays consistent.
//
// Why a separate module:
//   - The profile page imports it once. Joshy's `update_animal` validator can
//     reuse the same set so voice commands and form edits agree on what's
//     allowed.
//   - When a new color shows up in a future spreadsheet import, add it here
//     and every consumer sees it without code duplication.

import { herds } from "./animals";

export const SEX_OPTIONS = ["Jenny", "Jack", "Gelding"] as const;

export const SIZE_OPTIONS = ["Mini", "Standard", "Mammoth"] as const;

// Colors that actually appear in the adoption spreadsheet, alphabetized.
// "Dragon" is in here because it's authoritatively used for Saphira; flagged
// as suspect in the audit but not removed without confirmation.
export const COLOR_OPTIONS = [
  "Black",
  "Blue",
  "Brown",
  "Dragon",
  "Grey",
  "Grey Brown",
  "Pink",
  "Red",
  "Sorrel",
  "Spotted",
  "White",
] as const;

// Herds derived from the canonical `herds` array in animals.ts.
export const HERD_OPTIONS = [...herds] as readonly string[];

export type SexOption = (typeof SEX_OPTIONS)[number];
export type SizeOption = (typeof SIZE_OPTIONS)[number];
export type ColorOption = (typeof COLOR_OPTIONS)[number];
