"use client";

// Printable animal-profile binder (grant requirement: hard copies of every
// animal profile). One page per donkey via `break-after-page`; the on-screen
// toolbar is hidden when printing. Staff hit "Print / Save as PDF" and use
// the browser dialog to print or save.
//
// Data sources:
//   - Live roster from useAnimals() (CSV base + DB overlay)
//   - Medical: DB entries (useMedical) merged over seeded CSV history
//     (getRecordsForAnimal), deduped by id — same merge the profile page does
//   - Hoof visits + next-due dates: one fetch of /api/hoof-visits, grouped
//     client-side
//   - Special-needs text / last exam: getDonkeyProfile
//   - Next vaccination: getNextVaccinationDue

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import type { Animal } from "@/lib/animals";
import { useAnimals } from "@/lib/animals-context";
import { useMedical } from "@/lib/medical-context";
import { useParkingLot } from "@/lib/parking-lot-context";
import { getRecordsForAnimal, type MedicalRecord } from "@/lib/medical-data";
import { getDonkeyProfile } from "@/lib/donkey-profiles-data";
import { getNextVaccinationDue } from "@/lib/deworming-vaccination-data";
import { formatDate } from "@/lib/format-date";

const MEDICAL_CAP = 25;
const HOOF_CAP = 10;

interface HoofVisitRow {
  id: string;
  animal: string;
  date: string;
  provider: string;
  notes: string;
}

interface HoofData {
  byAnimal: Map<string, HoofVisitRow[]>;
  nextDue: Record<string, string | null>;
}

export default function PrintAnimalsPage() {
  return (
    <Suspense fallback={null}>
      <PrintAnimalsInner />
    </Suspense>
  );
}

function PrintAnimalsInner() {
  const { animals, herds } = useAnimals();
  const { entries: dbMedicalEntries } = useMedical();
  const searchParams = useSearchParams();
  const slugFilter = searchParams?.get("animal") ?? null;

  // One fetch for all hoof visits; grouped by animal client-side.
  const [hoofData, setHoofData] = useState<HoofData>({
    byAnimal: new Map(),
    nextDue: {},
  });
  useEffect(() => {
    let cancelled = false;
    fetch("/api/hoof-visits", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (data: {
          entries?: HoofVisitRow[];
          nextDue?: Record<string, string | null>;
        } | null) => {
          if (cancelled || !data?.entries) return;
          const byAnimal = new Map<string, HoofVisitRow[]>();
          for (const v of data.entries) {
            const arr = byAnimal.get(v.animal) ?? [];
            arr.push(v);
            byAnimal.set(v.animal, arr);
          }
          for (const arr of byAnimal.values()) {
            arr.sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );
          }
          setHoofData({ byAnimal, nextDue: data.nextDue ?? {} });
        }
      )
      .catch(() => {
        // Hoof section just renders empty if the fetch fails.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Sorted roster: herd (in the app's herd order, unknown herds last),
  // then name. `?animal=<slug>` narrows to a single donkey.
  const roster = useMemo(() => {
    const herdRank = (h: string) => {
      const i = herds.indexOf(h);
      return i === -1 ? herds.length : i;
    };
    const list = slugFilter
      ? animals.filter((a) => a.slug === slugFilter)
      : [...animals];
    return list.sort((a, b) => {
      const dr = herdRank(a.herd) - herdRank(b.herd);
      if (dr !== 0) return dr;
      if (a.herd !== b.herd) return a.herd.localeCompare(b.herd);
      return a.name.localeCompare(b.name);
    });
  }, [animals, herds, slugFilter]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Screen-only toolbar */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">
            Animal Profiles — Print Binder
          </h1>
          <p className="text-sm text-warm-gray mt-0.5">
            {roster.length} donkey{roster.length === 1 ? "" : "s"} · one page
            each · use your browser&apos;s dialog to print or save as PDF
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/app/animals"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-card-border rounded-lg text-sm font-medium text-charcoal hover:bg-cream transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Animals
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-sidebar text-white rounded-lg text-sm font-medium hover:bg-sidebar-light transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print / Save as PDF
          </button>
        </div>
      </div>

      {roster.length === 0 ? (
        <p className="text-sm text-warm-gray py-10 text-center print:hidden">
          No matching donkey found.
        </p>
      ) : (
        roster.map((animal) => (
          <ProfileSheet
            key={animal.slug}
            animal={animal}
            dbMedicalEntries={dbMedicalEntries}
            hoofVisits={hoofData.byAnimal.get(animal.name) ?? []}
            nextHoofDue={hoofData.nextDue[animal.name] ?? null}
          />
        ))
      )}
    </div>
  );
}

// ── One printed page per donkey ──

function ProfileSheet({
  animal,
  dbMedicalEntries,
  hoofVisits,
  nextHoofDue,
}: {
  animal: Animal;
  dbMedicalEntries: MedicalRecord[];
  hoofVisits: HoofVisitRow[];
  nextHoofDue: string | null;
}) {
  const profile = getDonkeyProfile(animal.name);
  const nextVaccination = getNextVaccinationDue(animal.name);

  // Per-donkey notes: the profile Notes tab (general) + Relationships-tab
  // notes, same filters those tabs use.
  const { entries: parkingEntries } = useParkingLot();
  const generalNotes = parkingEntries.filter(
    (e) =>
      e.type === "note" &&
      !e.resolved &&
      e.data?.animal === animal.name &&
      e.data?.title !== "relationship"
  );
  const relationshipNotes = parkingEntries.filter(
    (e) =>
      e.type === "note" &&
      !e.resolved &&
      e.data?.animal === animal.name &&
      e.data?.title === "relationship"
  );

  // Merge DB medical entries over the seeded CSV history — dedupe by id,
  // DB entries win (same contract as the animal profile page).
  const records = useMemo(() => {
    const dbForAnimal = dbMedicalEntries.filter(
      (e) => e.animal === animal.name
    );
    const seen = new Set<string>();
    return [...dbForAnimal, ...getRecordsForAnimal(animal.name)]
      .filter((r) => {
        if (seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [dbMedicalEntries, animal.name]);

  const visibleRecords = records.slice(0, MEDICAL_CAP);
  const hiddenRecordCount = records.length - visibleRecords.length;
  const visibleHoof = hoofVisits.slice(0, HOOF_CAP);
  const hiddenHoofCount = hoofVisits.length - visibleHoof.length;

  const flags: string[] = [];
  if (animal.isSpecialNeedsFlag) flags.push("Special Needs");
  if (animal.isOver20) flags.push("Senior 20+");
  if (animal.isUnder3) flags.push("Under 3");
  if (animal.isBondedPair) flags.push("Bonded Pair");
  if (animal.momBabyCount && animal.momBabyCount > 0)
    flags.push(`Mom of ${animal.momBabyCount}`);
  if (animal.needsChip) flags.push("Needs Microchip");

  const relationships: { label: string; names: string[] }[] = [
    { label: "Parents", names: animal.parents ?? [] },
    { label: "Children", names: animal.children ?? [] },
    { label: "Friends", names: animal.bestFriends },
  ].filter((g) => g.names.length > 0);

  const identity: { label: string; value: string }[] = [
    { label: "Age", value: animal.age || "—" },
    { label: "Sex", value: animal.sex || "—" },
    { label: "Size", value: animal.size || "—" },
    { label: "Color", value: animal.color || "—" },
    { label: "Birth Date", value: formatDate(animal.birthDate) },
    { label: "Origin", value: animal.origin || "—" },
    { label: "Intake Date", value: formatDate(animal.intakeDate) },
    { label: "Adopted From", value: animal.adoptedFrom || "—" },
    {
      label: "Microchip",
      value: animal.microchip || (animal.needsChip ? "Needs chip" : "—"),
    },
    {
      label: "Last Annual Exam",
      value: formatDate(profile?.lastAnnualExam),
    },
    { label: "Next Vaccination", value: formatDate(nextVaccination) },
    { label: "Next Hoof", value: formatDate(nextHoofDue) },
  ];

  return (
    <section className="break-after-page mb-10 print:mb-0 bg-white rounded-xl border border-card-border p-6 print:border-0 print:rounded-none print:p-4 print:pt-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b-2 border-charcoal pb-3 break-inside-avoid">
        <div>
          <h2 className="text-3xl font-bold text-charcoal leading-tight">
            {animal.name}
          </h2>
          {animal.tagline && (
            <p className="text-sm italic text-charcoal mt-0.5">
              “{animal.tagline}”
            </p>
          )}
          <p className="text-sm text-warm-gray print:text-black mt-1">
            {animal.herd}
            {animal.pen ? ` · ${animal.pen}` : ""}
          </p>
          <p className="text-sm font-medium text-charcoal mt-0.5">
            Status: {animal.status || "—"}
          </p>
        </div>
        {animal.profileImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={animal.profileImage}
            alt={animal.name}
            className="h-32 w-32 object-cover rounded-lg shrink-0 border border-card-border print:border-black"
          />
        )}
      </div>

      {/* Identity grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 print:grid-cols-3 gap-x-4 gap-y-3 mt-4 break-inside-avoid">
        {identity.map((f) => (
          <div key={f.label}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-warm-gray print:text-black">
              {f.label}
            </p>
            <p className="text-sm text-charcoal">{f.value}</p>
          </div>
        ))}
      </div>

      {/* Flags */}
      {flags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4 break-inside-avoid">
          {flags.map((f) => (
            <span
              key={f}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full border border-charcoal text-xs font-semibold text-charcoal"
            >
              {f}
            </span>
          ))}
        </div>
      )}

      {/* Personality traits */}
      {animal.traits.length > 0 && (
        <div className="mt-4 break-inside-avoid">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-warm-gray print:text-black mb-1">
            Personality Traits
          </p>
          <div className="flex flex-wrap gap-1.5">
            {animal.traits.map((t) => (
              <span
                key={t}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full border border-charcoal/40 text-xs text-charcoal"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Relationships */}
      {(relationships.length > 0 || relationshipNotes.length > 0) && (
        <div className="mt-4 space-y-1 break-inside-avoid">
          {relationships.map((g) => (
            <p key={g.label} className="text-sm text-charcoal">
              <span className="font-semibold">{g.label}:</span>{" "}
              {g.names.join(", ")}
            </p>
          ))}
          {relationshipNotes.map((n) => (
            <p key={n.id} className="text-sm text-charcoal leading-snug">
              <span className="font-semibold">Relationship note:</span> {n.text}
            </p>
          ))}
        </div>
      )}

      {/* Special needs / behavioral text */}
      {(profile?.specialNeedsDetail || animal.behavioralNotes) && (
        <div className="mt-4 space-y-2 break-inside-avoid">
          {profile?.specialNeedsDetail && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-warm-gray print:text-black">
                Special Needs / Medical
              </p>
              <p className="text-sm text-charcoal leading-snug whitespace-pre-line">
                {profile.specialNeedsDetail}
              </p>
            </div>
          )}
          {animal.behavioralNotes && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-warm-gray print:text-black">
                Behavioral Notes
              </p>
              <p className="text-sm text-charcoal leading-snug whitespace-pre-line">
                {animal.behavioralNotes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Notes (from the profile's Notes tab) */}
      {generalNotes.length > 0 && (
        <div className="mt-4 break-inside-avoid">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-warm-gray print:text-black mb-1">
            Notes
          </p>
          <ul className="space-y-1">
            {generalNotes.map((n) => (
              <li key={n.id} className="text-sm text-charcoal leading-snug">
                • {n.text}
                {n.data?.date ? ` (${formatDate(n.data.date)})` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Origin story */}
      {animal.story.length > 0 && (
        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-warm-gray print:text-black mb-1">
            Origin Story
          </p>
          <div className="space-y-2">
            {animal.story.map((paragraph, i) => (
              <p key={i} className="text-sm text-charcoal leading-snug whitespace-pre-line">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Medical history */}
      {visibleRecords.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-bold text-charcoal uppercase tracking-wider border-b border-charcoal pb-1 mb-2">
            Medical History
          </h3>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-card-border print:border-black">
                <th className="py-1 pr-2 font-semibold w-20">Date</th>
                <th className="py-1 pr-2 font-semibold w-24">Type</th>
                <th className="py-1 pr-2 font-semibold w-40">Title</th>
                <th className="py-1 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody>
              {visibleRecords.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-card-border align-top break-inside-avoid"
                >
                  <td className="py-1 pr-2 whitespace-nowrap">
                    {formatDate(r.date)}
                  </td>
                  <td className="py-1 pr-2">{r.type}</td>
                  <td className="py-1 pr-2 font-medium">{r.title}</td>
                  <td className="py-1">{r.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {hiddenRecordCount > 0 && (
            <p className="text-[11px] text-warm-gray print:text-black mt-1 italic">
              +{hiddenRecordCount} older entr
              {hiddenRecordCount === 1 ? "y" : "ies"} (see the app for the full
              history)
            </p>
          )}
        </div>
      )}

      {/* Hoof visits */}
      {visibleHoof.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-bold text-charcoal uppercase tracking-wider border-b border-charcoal pb-1 mb-2">
            Hoof Visits
          </h3>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-card-border print:border-black">
                <th className="py-1 pr-2 font-semibold w-20">Date</th>
                <th className="py-1 pr-2 font-semibold w-36">Provider</th>
                <th className="py-1 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody>
              {visibleHoof.map((v) => (
                <tr
                  key={v.id}
                  className="border-b border-card-border align-top break-inside-avoid"
                >
                  <td className="py-1 pr-2 whitespace-nowrap">
                    {formatDate(v.date)}
                  </td>
                  <td className="py-1 pr-2">{v.provider || "—"}</td>
                  <td className="py-1">{v.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {hiddenHoofCount > 0 && (
            <p className="text-[11px] text-warm-gray print:text-black mt-1 italic">
              +{hiddenHoofCount} older entr
              {hiddenHoofCount === 1 ? "y" : "ies"} (see the app for the full
              history)
            </p>
          )}
        </div>
      )}
    </section>
  );
}
