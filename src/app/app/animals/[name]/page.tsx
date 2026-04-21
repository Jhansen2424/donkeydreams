"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Heart,
  Stethoscope,
  ClipboardCheck,
  Users,
  Camera,
  StickyNote,
  Save,
  X,
  Handshake,
  Mail,
} from "lucide-react";
import { getAnimalBySlug, type Animal } from "@/lib/animals";
import {
  getRecordsForAnimal,
  typeBadgeColors,
  type MedicalRecord,
  type MedicalRecordType,
} from "@/lib/medical-data";
import { useMedical } from "@/lib/medical-context";
import { useParkingLot } from "@/lib/parking-lot-context";
import { visitHistory } from "@/lib/hoof-dental-data";
import { getTrimProfile } from "@/lib/trimming-data";
import { getDewormingDosage } from "@/lib/power-pack-data";
import { getDonkeyWeight } from "@/lib/scheduled-and-events-data";
import TrimPhotos from "@/components/app/TrimPhotos";
import {
  getSponsorsForAnimal,
  tierMeta,
  type Sponsor,
} from "@/lib/sponsor-data";

const tabs = [
  { id: "overview", label: "Overview", icon: Heart },
  { id: "medical", label: "Medical", icon: Stethoscope },
  { id: "tasks", label: "Daily Care", icon: ClipboardCheck },
  { id: "relationships", label: "Relationships", icon: Users },
  { id: "photos", label: "Photos", icon: Camera },
  { id: "notes", label: "Notes", icon: StickyNote },
];

export default function AnimalProfilePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.name as string;
  const animal = getAnimalBySlug(slug);

  // Open on the tab requested via `?tab=...` when the link targets a section
  // (e.g. Medical Entries page → profile Medical tab).
  const initialTab = (() => {
    const t = searchParams?.get("tab");
    return t && tabs.some((x) => x.id === t) ? t : "overview";
  })();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [editing, setEditing] = useState(false);

  // Keep `activeTab` in sync with URL changes (e.g. back/forward navigation).
  useEffect(() => {
    const t = searchParams?.get("tab");
    if (t && tabs.some((x) => x.id === t) && t !== activeTab) {
      setActiveTab(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  if (!animal) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-3">🫏</p>
        <p className="text-warm-gray font-medium">Donkey not found</p>
        <button
          onClick={() => router.push("/app/animals")}
          className="mt-4 text-sky font-medium hover:underline"
        >
          Back to all animals
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/app/animals")}
          className="inline-flex items-center gap-1.5 text-sm text-warm-gray hover:text-charcoal transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          All Animals
        </button>
        <button
          onClick={() => setEditing(!editing)}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            editing
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-white border border-card-border text-charcoal hover:bg-cream"
          }`}
        >
          {editing ? (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          ) : (
            <>
              <Pencil className="w-4 h-4" />
              Edit Profile
            </>
          )}
        </button>
      </div>

      {/* Profile header */}
      <div className="bg-white rounded-xl border border-card-border overflow-hidden">
        <div className="md:flex">
          {/* Photo */}
          <div className="md:w-80 shrink-0 aspect-square md:aspect-auto bg-cream overflow-hidden">
            {animal.profileImage ? (
              <img
                src={animal.profileImage}
                alt={animal.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center min-h-[240px]">
                <span className="text-7xl">🫏</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 p-6">
            <div className="flex items-start justify-between mb-1">
              <h1 className="text-3xl font-bold text-charcoal">
                {animal.name}
              </h1>
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  animal.status === "Active"
                    ? "bg-emerald-100 text-emerald-700"
                    : animal.status === "Special Needs"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                }`}
              >
                {animal.status}
              </span>
            </div>
            <p className="text-warm-gray mb-4">{animal.tagline}</p>

            {/* Quick info grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
              <InfoItem label="Age" value={animal.age} editing={editing} />
              <InfoItem label="Sex" value={animal.sex} editing={editing} />
              <InfoItem label="Origin" value={animal.origin} editing={editing} />
              <InfoItem label="Herd" value={animal.herd} editing={editing} />
              <InfoItem label="Pen" value={animal.pen} editing={editing} />
              <InfoItem label="Intake Date" value={animal.intakeDate} editing={editing} />
              <InfoItem label="Adopted From" value={animal.adoptedFrom} editing={editing} />
            </div>

            {/* Tags + adoption status badges */}
            <div className="flex flex-wrap gap-1.5">
              {animal.tags.map((tag) => (
                <span
                  key={tag.label}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                    tag.color === "green"
                      ? "bg-emerald-100 text-emerald-700"
                      : tag.color === "blue"
                        ? "bg-sky/10 text-sky-dark"
                        : tag.color === "amber"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                  }`}
                >
                  {tag.label}
                </span>
              ))}
              <AdoptionStatusBadges animal={animal} />
            </div>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-card-border overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-sidebar text-sidebar"
                    : "border-transparent text-warm-gray hover:text-charcoal"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "overview" && <OverviewTab animal={animal} editing={editing} />}
        {activeTab === "medical" && <MedicalTab animal={animal} />}
        {activeTab === "tasks" && <TasksTab animal={animal} />}
        {activeTab === "relationships" && <RelationshipsTab animal={animal} />}
        {activeTab === "photos" && <PhotosTab animal={animal} />}
        {activeTab === "notes" && <NotesTab animal={animal} />}
      </div>
    </div>
  );
}

/* ── Adoption status badges ── */
function AdoptionStatusBadges({ animal }: { animal: Animal }) {
  const badges: { label: string; cls: string }[] = [];

  if (animal.isSpecialNeedsFlag) {
    badges.push({
      label: "Special Needs Sponsor",
      cls: "bg-red-100 text-red-700 border border-red-200",
    });
  }
  if (animal.isOver20) {
    badges.push({
      label: "Senior Care",
      cls: "bg-amber-100 text-amber-700 border border-amber-200",
    });
  }
  if (animal.isBondedPair) {
    badges.push({
      label: "Bonded Pair Required",
      cls: "bg-purple-100 text-purple-700 border border-purple-200",
    });
  }
  if ((animal.momBabyCount ?? 0) > 0) {
    badges.push({
      label:
        animal.momBabyCount === 1 ? "Mom + Baby" : `Mom of ${animal.momBabyCount}`,
      cls: "bg-pink-100 text-pink-700 border border-pink-200",
    });
  }
  if (animal.needsChip) {
    badges.push({
      label: "Needs Microchip",
      cls: "bg-orange-100 text-orange-700 border border-orange-200",
    });
  }
  if (badges.length === 0) {
    badges.push({
      label: "Available for Adoption",
      cls: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    });
  }

  return (
    <>
      {badges.map((b) => (
        <span
          key={b.label}
          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${b.cls}`}
        >
          {b.label}
        </span>
      ))}
    </>
  );
}

/* ── Info item (editable) ── */
function InfoItem({
  label,
  value,
  editing,
}: {
  label: string;
  value: string;
  editing: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-warm-gray/60 mb-0.5">
        {label}
      </p>
      {editing ? (
        <input
          defaultValue={value}
          className="w-full px-2 py-1 text-sm border border-card-border rounded-md text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
        />
      ) : (
        <p className="text-sm font-medium text-charcoal">{value}</p>
      )}
    </div>
  );
}

/* ── Overview Tab ── */
function OverviewTab({ animal, editing }: { animal: Animal; editing: boolean }) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Story */}
      <div className="bg-white rounded-xl border border-card-border p-5">
        <h3 className="font-bold text-charcoal mb-3">Origin Story</h3>
        {editing ? (
          <textarea
            defaultValue={animal.story.join("\n\n")}
            rows={8}
            className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal leading-relaxed focus:outline-none focus:ring-2 focus:ring-sand/50"
          />
        ) : (
          <div className="space-y-3 text-sm text-warm-gray leading-relaxed">
            {animal.story.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}
      </div>

      {/* Traits + Behavioral */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-card-border p-5">
          <h3 className="font-bold text-charcoal mb-3">Personality Traits</h3>
          <div className="flex flex-wrap gap-2">
            {animal.traits.map((trait) => (
              <span
                key={trait}
                className="text-sm bg-cream text-charcoal px-3 py-1.5 rounded-full font-medium"
              >
                {trait}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-card-border p-5">
          <h3 className="font-bold text-charcoal mb-3">Behavioral Notes</h3>
          {editing ? (
            <textarea
              defaultValue={animal.behavioralNotes}
              rows={4}
              placeholder="Likes ears scratched, scared of side-by-sides, etc."
              className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal leading-relaxed focus:outline-none focus:ring-2 focus:ring-sand/50"
            />
          ) : (
            <p className="text-sm text-warm-gray leading-relaxed">
              {animal.behavioralNotes || "No behavioral notes yet."}
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-card-border p-5">
          <h3 className="font-bold text-charcoal mb-3">Best Friends</h3>
          <div className="flex flex-wrap gap-2">
            {animal.bestFriends.map((friend) => (
              <span
                key={friend}
                className="inline-flex items-center gap-1.5 text-sm bg-sky/10 text-sky-dark px-3 py-1.5 rounded-full font-medium"
              >
                <Heart className="w-3 h-3 fill-current" />
                {friend}
              </span>
            ))}
          </div>
        </div>
        {/* Sponsor info */}
        <SponsorCard animal={animal} />
        {/* Adoption / identity info */}
        <AdoptionInfoCard animal={animal} />
      </div>
    </div>
  );
}

/* ── Adoption Info Card ── */
function AdoptionInfoCard({ animal }: { animal: Animal }) {
  const hasIdentity =
    animal.birthDate ||
    animal.color ||
    animal.size ||
    animal.microchip ||
    animal.needsChip;
  const hasFamily =
    (animal.parents && animal.parents.length > 0) ||
    (animal.children && animal.children.length > 0) ||
    (animal.bondedWith && animal.bondedWith.length > 0);

  if (!hasIdentity && !hasFamily) return null;

  return (
    <div className="bg-white rounded-xl border border-card-border p-5 space-y-4">
      <h3 className="font-bold text-charcoal">Adoption & Identity</h3>

      {hasIdentity && (
        <div className="grid grid-cols-2 gap-3">
          {animal.birthDate && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-warm-gray/60 mb-0.5">
                Birth Date
              </p>
              <p className="text-sm font-medium text-charcoal">
                {new Date(animal.birthDate + "T00:00:00").toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric", year: "numeric" }
                )}
              </p>
            </div>
          )}
          {animal.color && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-warm-gray/60 mb-0.5">
                Color
              </p>
              <p className="text-sm font-medium text-charcoal">{animal.color}</p>
            </div>
          )}
          {animal.size && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-warm-gray/60 mb-0.5">
                Size
              </p>
              <p className="text-sm font-medium text-charcoal">{animal.size}</p>
            </div>
          )}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-warm-gray/60 mb-0.5">
              Microchip
            </p>
            {animal.microchip ? (
              <p className="text-xs font-mono text-charcoal break-all">
                {animal.microchip}
              </p>
            ) : (
              <p className="text-xs font-medium text-orange-600">
                Needs chip
              </p>
            )}
          </div>
        </div>
      )}

      {hasFamily && (
        <div className="space-y-3 pt-2 border-t border-card-border">
          {animal.parents && animal.parents.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-warm-gray/60 mb-1">
                Parent{animal.parents.length > 1 ? "s" : ""}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {animal.parents.map((p) => (
                  <FamilyChip key={p} name={p} />
                ))}
              </div>
            </div>
          )}
          {animal.children && animal.children.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-warm-gray/60 mb-1">
                {animal.children.length === 1 ? "Child" : "Children"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {animal.children.map((c) => (
                  <FamilyChip key={c} name={c} />
                ))}
              </div>
            </div>
          )}
          {animal.bondedWith && animal.bondedWith.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-warm-gray/60 mb-1">
                Bonded With
              </p>
              <div className="flex flex-wrap gap-1.5">
                {animal.bondedWith.map((b) => (
                  <FamilyChip key={b} name={b} bonded />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FamilyChip({ name, bonded = false }: { name: string; bonded?: boolean }) {
  const animal = getAnimalBySlug(slugify(name));
  const cls = bonded
    ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
    : "bg-cream text-charcoal hover:bg-sand/30";
  if (animal) {
    return (
      <a
        href={`/app/animals/${animal.slug}`}
        className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${cls}`}
      >
        {name}
      </a>
    );
  }
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${cls} opacity-60`}>
      {name}
    </span>
  );
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\s-]+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/* ── Sponsor Card ── */
function SponsorCard({ animal }: { animal: Animal }) {
  const animalSponsors = getSponsorsForAnimal(animal.name);

  if (!animal.sponsorable) return null;

  const today = new Date().toISOString().split("T")[0];

  function daysSince(iso: string) {
    return Math.round(
      (new Date(today).getTime() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  function formatDate(iso: string) {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div className="bg-white rounded-xl border border-card-border p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-charcoal flex items-center gap-2">
          <Handshake className="w-4 h-4 text-warm-gray/60" />
          Sponsors
        </h3>
        {animalSponsors.length > 0 && (
          <span className="text-xs font-semibold text-warm-gray bg-cream px-2 py-0.5 rounded-full">
            {animalSponsors.length}
          </span>
        )}
      </div>

      {animalSponsors.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-warm-gray">No sponsors yet</p>
          <p className="text-xs text-warm-gray/60 mt-1">
            Available for sponsorship
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {animalSponsors.map((sponsor) => {
            const days = daysSince(sponsor.lastUpdateSent);
            const overdue = days >= sponsor.updateInterval;
            return (
              <div
                key={sponsor.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-cream/50 border border-card-border"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-charcoal truncate">
                      {sponsor.name}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tierMeta[sponsor.tier].bg} ${tierMeta[sponsor.tier].color}`}
                    >
                      {sponsor.tier}
                    </span>
                  </div>
                  <p className="text-xs text-warm-gray">
                    Since {formatDate(sponsor.startDate)}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Mail className="w-3 h-3 text-warm-gray/50" />
                    <span className={`text-xs ${overdue ? "text-red-600 font-semibold" : "text-warm-gray"}`}>
                      Last update: {formatDate(sponsor.lastUpdateSent)}
                      {overdue && ` (${days - sponsor.updateInterval}d overdue)`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Medical Tab ── */
function MedicalTypeBadge({ type }: { type: MedicalRecordType }) {
  const colors = typeBadgeColors[type] || { bg: "bg-gray-100", text: "text-gray-700" };
  return (
    <span
      className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${colors.bg} ${colors.text}`}
    >
      {type}
    </span>
  );
}

function formatRecordDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type MedicalSubTab = "all" | "deworming" | "vaccinations" | "hoof-trims" | "fecal-tests" | "other";

const medicalSubTabs: { id: MedicalSubTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "deworming", label: "Deworming" },
  { id: "vaccinations", label: "Vaccinations" },
  { id: "hoof-trims", label: "Hoof Trims" },
  { id: "fecal-tests", label: "Fecal Tests" },
  { id: "other", label: "Other" },
];

function MedicalRecordCard({ record }: { record: MedicalRecord }) {
  return (
    <div
      className={`bg-white rounded-xl border p-4 flex items-start gap-4 ${
        record.urgent ? "border-red-200 bg-red-50/30" : "border-card-border"
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <MedicalTypeBadge type={record.type} />
          {record.urgent && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-600">
              Urgent
            </span>
          )}
        </div>
        <p className="font-semibold text-charcoal text-sm">{record.title}</p>
        <p className="text-xs text-warm-gray mt-0.5">
          {formatRecordDate(record.date)}
        </p>
        {record.description && (
          <p className="text-sm text-warm-gray mt-2 leading-relaxed">
            {record.description}
          </p>
        )}
      </div>
    </div>
  );
}

function MedicalTab({ animal }: { animal: Animal }) {
  const { entries: dbEntries } = useMedical();
  const seedRecords = getRecordsForAnimal(animal.name);
  // Merge DB entries for this animal with the seeded CSV history. Dedupe on
  // id; keep DB entries first so they win on collision. Sort newest-first to
  // match `getRecordsForAnimal`'s original contract.
  const records = (() => {
    const dbForAnimal = dbEntries.filter((e) => e.animal === animal.name);
    const seen = new Set<string>();
    return [...dbForAnimal, ...seedRecords]
      .filter((r) => {
        if (seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  })();
  const [subTab, setSubTab] = useState<MedicalSubTab>("all");

  const hoofVisits = visitHistory
    .filter((v) => v.animal === animal.name && v.type === "hoof")
    .sort((a, b) => b.date.localeCompare(a.date));
  const trimProfile = getTrimProfile(animal.name);
  const dewormingDosage = getDewormingDosage(animal.name);
  const donkeyWeight = getDonkeyWeight(animal.name);

  const filtered = records.filter((r) => {
    if (subTab === "all") return true;
    if (subTab === "deworming") return r.type === "Deworming";
    if (subTab === "vaccinations") return r.type === "Vaccination";
    if (subTab === "fecal-tests") return r.type === "Fecal Test";
    if (subTab === "hoof-trims") return false; // handled separately below
    return (
      r.type !== "Deworming" &&
      r.type !== "Vaccination" &&
      r.type !== "Fecal Test"
    );
  });

  const counts = {
    all: records.length,
    deworming: records.filter((r) => r.type === "Deworming").length,
    vaccinations: records.filter((r) => r.type === "Vaccination").length,
    "hoof-trims": hoofVisits.length,
    "fecal-tests": records.filter((r) => r.type === "Fecal Test").length,
    other: records.filter(
      (r) =>
        r.type !== "Deworming" &&
        r.type !== "Vaccination" &&
        r.type !== "Fecal Test"
    ).length,
  };

  const mostRecent = (type: MedicalRecordType) =>
    records.find((r) => r.type === type);
  const lastDeworm = mostRecent("Deworming");
  const lastVacc = mostRecent("Vaccination");
  const lastTrim = hoofVisits[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-charcoal">
          Medical Entries
          {records.length > 0 && (
            <span className="ml-2 text-sm font-normal text-warm-gray">
              ({records.length})
            </span>
          )}
        </h3>
        <a
          href="/app/medical"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-sidebar text-white rounded-lg text-sm font-medium hover:bg-sidebar-light transition-colors"
        >
          + Add Entry
        </a>
      </div>

      {/* Sub-tab navigation */}
      <div className="border-b border-card-border">
        <div className="flex gap-1 overflow-x-auto">
          {medicalSubTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                subTab === t.id
                  ? "border-sidebar text-sidebar"
                  : "border-transparent text-warm-gray hover:text-charcoal"
              }`}
            >
              {t.label}
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                  subTab === t.id ? "bg-sidebar/10 text-sidebar" : "bg-cream text-warm-gray"
                }`}
              >
                {counts[t.id]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards on Deworming sub-tab */}
      {subTab === "deworming" && (lastDeworm || dewormingDosage || donkeyWeight) && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {lastDeworm && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-orange-700/80 mb-1">
                Most Recent Deworming
              </p>
              <p className="text-base font-bold text-charcoal">{lastDeworm.title}</p>
              <p className="text-xs text-warm-gray mt-0.5">
                {formatRecordDate(lastDeworm.date)}
              </p>
            </div>
          )}
          {dewormingDosage && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700/80 mb-1">
                Dosage Profile
              </p>
              <p className="text-base font-bold text-charcoal capitalize">
                {dewormingDosage.category}
              </p>
              <p className="text-xs text-warm-gray mt-0.5">
                {dewormingDosage.doses} × {dewormingDosage.doseGrams}g per treatment
              </p>
            </div>
          )}
          {donkeyWeight && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-700/80 mb-1">
                Body Weight
              </p>
              <p className="text-base font-bold text-charcoal">
                {donkeyWeight.lbs} lbs
              </p>
              <p className="text-xs text-warm-gray mt-0.5">
                {donkeyWeight.kg.toFixed(1)} kg
              </p>
            </div>
          )}
        </div>
      )}

      {/* Most recent fecal test summary */}
      {subTab === "fecal-tests" && counts["fecal-tests"] > 0 && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-700/80 mb-1">
            Most Recent Fecal Test
          </p>
          {(() => {
            const last = records.find((r) => r.type === "Fecal Test");
            return last ? (
              <>
                <p className="text-base font-bold text-charcoal">{last.title}</p>
                <p className="text-xs text-warm-gray mt-0.5">
                  {formatRecordDate(last.date)}
                </p>
              </>
            ) : null;
          })()}
        </div>
      )}
      {subTab === "vaccinations" && lastVacc && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-green-700/80 mb-1">
            Most Recent Vaccination
          </p>
          <p className="text-base font-bold text-charcoal">{lastVacc.title}</p>
          <p className="text-xs text-warm-gray mt-0.5">
            {formatRecordDate(lastVacc.date)}
          </p>
        </div>
      )}

      {/* ── Hoof Trims sub-tab ── */}
      {subTab === "hoof-trims" ? (
        <div className="space-y-4">
          {/* Most recent trim summary */}
          {lastTrim && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700/80 mb-1">
                Most Recent Trim
              </p>
              <p className="text-base font-bold text-charcoal">
                {formatRecordDate(lastTrim.date)}
              </p>
              {lastTrim.notes && (
                <p className="text-sm text-warm-gray mt-1">{lastTrim.notes}</p>
              )}
            </div>
          )}

          {/* Trim profile cards (durable instructions) */}
          {trimProfile?.protocols && (
            <div className="bg-white rounded-xl border border-card-border p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-warm-gray/60 mb-2">
                Trimming Protocols
              </p>
              <p className="text-sm text-charcoal leading-relaxed whitespace-pre-wrap">
                {trimProfile.protocols}
              </p>
            </div>
          )}
          {trimProfile?.preTrimTreatment && (
            <div className="bg-white rounded-xl border border-card-border p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-warm-gray/60 mb-2">
                Pre-Trim Treatment
              </p>
              <p className="text-sm text-charcoal leading-relaxed">
                {trimProfile.preTrimTreatment}
              </p>
            </div>
          )}
          {trimProfile?.squishPads && (
            <div className="bg-white rounded-xl border border-card-border p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-warm-gray/60 mb-2">
                Squish Pads
              </p>
              <p className="text-sm text-charcoal leading-relaxed">
                {trimProfile.squishPads}
              </p>
            </div>
          )}
          {trimProfile?.recentNotes && (
            <div className="bg-white rounded-xl border border-card-border p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-warm-gray/60 mb-2">
                Notes from Recent Trim
              </p>
              <p className="text-sm text-charcoal leading-relaxed">
                {trimProfile.recentNotes}
              </p>
            </div>
          )}

          {/* Trim history */}
          <div className="flex items-center justify-between pt-2">
            <h4 className="font-semibold text-charcoal text-sm">
              Trim History
              <span className="ml-2 text-xs font-normal text-warm-gray">
                ({hoofVisits.length})
              </span>
            </h4>
            <a
              href="/app/hoof-dental"
              className="text-xs text-sky-600 hover:underline"
            >
              View hoof care dashboard →
            </a>
          </div>

          {hoofVisits.length === 0 ? (
            <div className="bg-white rounded-xl border border-card-border p-8 text-center">
              <Stethoscope className="w-8 h-8 text-warm-gray/30 mx-auto mb-3" />
              <p className="text-warm-gray font-medium">No trim history yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {hoofVisits.map((visit) => (
                <div
                  key={visit.id}
                  className="bg-white rounded-lg border border-card-border p-3"
                >
                  <p className="text-xs font-semibold text-charcoal">
                    {formatRecordDate(visit.date)}
                  </p>
                  {visit.notes && visit.notes !== "Hoof trim." && (
                    <p className="text-xs text-warm-gray mt-0.5 leading-relaxed">
                      {visit.notes}
                    </p>
                  )}
                  <TrimPhotos visitId={visit.id} />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-card-border p-8 text-center">
          <Stethoscope className="w-8 h-8 text-warm-gray/30 mx-auto mb-3" />
          <p className="text-warm-gray font-medium">
            {subTab === "all"
              ? "No medical entries yet"
              : `No ${medicalSubTabs.find((t) => t.id === subTab)?.label.toLowerCase()} entries yet`}
          </p>
          <p className="text-sm text-warm-gray/60 mt-1">
            Add records from the{" "}
            <a href="/app/medical" className="text-sky-600 hover:underline">
              Medical Dashboard
            </a>
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((record) => (
            <MedicalRecordCard key={record.id} record={record} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Tasks Tab ── */
function TasksTab({ animal }: { animal: Animal }) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const toggle = (i: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-charcoal">Daily Care Tasks</h3>
        <p className="text-sm text-warm-gray">
          {checked.size}/{animal.tasks.length} complete
        </p>
      </div>

      {animal.tasks.length === 0 ? (
        <div className="bg-white rounded-xl border border-card-border p-8 text-center">
          <ClipboardCheck className="w-8 h-8 text-warm-gray/30 mx-auto mb-3" />
          <p className="text-warm-gray font-medium">No tasks assigned</p>
        </div>
      ) : (
        <div className="space-y-2">
          {animal.tasks.map((task, i) => (
            <button
              key={i}
              onClick={() => toggle(i)}
              className={`w-full flex items-center gap-3 bg-white rounded-xl border p-4 transition-all text-left ${
                checked.has(i)
                  ? "border-emerald-200 bg-emerald-50/50"
                  : "border-card-border hover:border-sand"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                  checked.has(i)
                    ? "bg-emerald-500 border-emerald-500"
                    : "border-card-border"
                }`}
              >
                {checked.has(i) && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    checked.has(i)
                      ? "text-warm-gray line-through"
                      : "text-charcoal"
                  }`}
                >
                  {task.title}
                </p>
                <p className="text-xs text-warm-gray/60 mt-0.5">
                  {task.interval} · {task.type}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Relationships Tab ── */
function RelationshipsTab({ animal }: { animal: Animal }) {
  // Relationship notes and per-animal field notes both live as parking-lot
  // entries (type "note") tagged with the animal name. The app filters on
  // data.animal to surface them here; they also show up on the main Notes
  // page for central triage.
  const { entries, addEntry, removeEntry } = useParkingLot();
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const relationshipNotes = entries.filter(
    (e) =>
      e.type === "note" &&
      !e.resolved &&
      e.data?.animal === animal.name &&
      e.data?.title === "relationship"
  );

  async function handleSave() {
    const text = draft.trim();
    if (!text) return;
    setSaving(true);
    try {
      await addEntry("note", text, { animal: animal.name, title: "relationship" });
      setDraft("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <h3 className="font-bold text-charcoal">Bonds & Relationships</h3>

      {animal.bestFriends.length === 0 ? (
        <div className="bg-white rounded-xl border border-card-border p-8 text-center">
          <Users className="w-8 h-8 text-warm-gray/30 mx-auto mb-3" />
          <p className="text-warm-gray font-medium">
            No relationships mapped yet
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {animal.bestFriends.map((friend) => (
            <div
              key={friend}
              className="bg-white rounded-xl border border-card-border p-4 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-cream flex items-center justify-center text-xl">
                🫏
              </div>
              <div>
                <p className="font-semibold text-charcoal">{friend}</p>
                <p className="text-xs text-warm-gray">Bonded companion</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Existing relationship notes */}
      {relationshipNotes.length > 0 && (
        <div className="space-y-2">
          {relationshipNotes.map((n) => (
            <div
              key={n.id}
              className="bg-white rounded-xl border border-card-border p-4 flex items-start gap-3 group"
            >
              <p className="text-sm text-charcoal flex-1 whitespace-pre-line">{n.text}</p>
              <button
                onClick={() => removeEntry(n.id)}
                title="Delete note"
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-warm-gray/50 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new relationship note */}
      <div className="bg-white rounded-xl border border-card-border p-5">
        <h4 className="font-semibold text-charcoal text-sm mb-3">
          Add Relationship Note
        </h4>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="e.g., Pink and Eli are inseparable — born one day apart, nursed by each other's moms..."
          rows={3}
          className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal leading-relaxed focus:outline-none focus:ring-2 focus:ring-sand/50 mb-3"
        />
        <button
          onClick={handleSave}
          disabled={!draft.trim() || saving}
          className="px-4 py-2 bg-sidebar text-white rounded-lg text-sm font-medium hover:bg-sidebar-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? "Saving..." : "Save Note"}
        </button>
      </div>
    </div>
  );
}

/* ── Photos Tab ── */
function PhotosTab({ animal }: { animal: Animal }) {
  // Photos are stored as URLs in `galleryImages` on the Animal record. No
  // file upload yet — users paste an image URL (from Google Drive share, S3,
  // etc.). The local optimistic list keeps the UI responsive while the API
  // PATCH round-trips.
  const [gallery, setGallery] = useState<string[]>(animal.galleryImages ?? []);
  const [urlDraft, setUrlDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function persist(next: string[]) {
    setError(null);
    const res = await fetch("/api/animals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: animal.name, galleryImages: next }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Failed to save photos");
    }
  }

  async function handleAdd() {
    const url = urlDraft.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      setError("Photo URL must start with http:// or https://");
      return;
    }
    const next = [...gallery, url];
    const prev = gallery;
    setGallery(next); // optimistic
    setUrlDraft("");
    setAdding(false);
    try {
      await persist(next);
    } catch (err) {
      setGallery(prev);
      setError(err instanceof Error ? err.message : "Failed to save photo");
    }
  }

  async function handleDelete(idx: number) {
    const next = gallery.filter((_, i) => i !== idx);
    const prev = gallery;
    setGallery(next);
    try {
      await persist(next);
    } catch (err) {
      setGallery(prev);
      setError(err instanceof Error ? err.message : "Failed to delete photo");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-charcoal">Photos</h3>
        <button
          onClick={() => setAdding((v) => !v)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-sidebar text-white rounded-lg text-sm font-medium hover:bg-sidebar-light transition-colors"
        >
          {adding ? "Cancel" : "+ Add Photo"}
        </button>
      </div>

      {adding && (
        <div className="bg-white rounded-xl border border-card-border p-5 space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-warm-gray/60">
            Photo URL
          </label>
          <input
            type="url"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
            autoFocus
          />
          <p className="text-[11px] text-warm-gray/70">
            Paste a URL from Google Drive (right-click a photo &rarr; Get link
            &rarr; change to &ldquo;Anyone with the link&rdquo;), Dropbox, or
            any public image host.
          </p>
          <div className="flex justify-end">
            <button
              onClick={handleAdd}
              disabled={!urlDraft.trim()}
              className="px-4 py-2 bg-sidebar text-white rounded-lg text-sm font-medium hover:bg-sidebar-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {gallery.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {gallery.map((img, i) => (
            <div
              key={`${img}-${i}`}
              className="relative group aspect-square rounded-xl overflow-hidden bg-cream border border-card-border"
            >
              <img
                src={img}
                alt={`${animal.name} photo ${i + 1}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
              <button
                onClick={() => handleDelete(i)}
                title="Delete photo"
                className="absolute top-1.5 right-1.5 p-1.5 bg-black/60 hover:bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-card-border p-8 text-center">
          <Camera className="w-8 h-8 text-warm-gray/30 mx-auto mb-3" />
          <p className="text-warm-gray font-medium">No photos yet</p>
        </div>
      )}
    </div>
  );
}

/* ── Notes Tab ── */
function NotesTab({ animal }: { animal: Animal }) {
  // Per-animal field notes live in the parking-lot (type "note"). Filtering
  // by data.animal keeps them keyed to this profile.
  const { entries, addEntry, removeEntry } = useParkingLot();
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const fieldNotes = entries.filter(
    (e) =>
      e.type === "note" &&
      !e.resolved &&
      e.data?.animal === animal.name &&
      e.data?.title !== "relationship"
  );

  async function handleSave() {
    const text = draft.trim();
    if (!text) return;
    setSaving(true);
    try {
      await addEntry("note", text, { animal: animal.name });
      setDraft("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-charcoal">Field Notes</h3>
      </div>

      {/* New note */}
      <div className="bg-white rounded-xl border border-card-border p-5">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Add a note about ${animal.name}...`}
          rows={3}
          className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal leading-relaxed focus:outline-none focus:ring-2 focus:ring-sand/50 mb-3"
        />
        <button
          onClick={handleSave}
          disabled={!draft.trim() || saving}
          className="px-4 py-2 bg-sidebar text-white rounded-lg text-sm font-medium hover:bg-sidebar-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? "Saving..." : "Save Note"}
        </button>
      </div>

      {/* Existing notes */}
      {fieldNotes.length === 0 ? (
        <div className="bg-white rounded-xl border border-card-border p-8 text-center">
          <StickyNote className="w-8 h-8 text-warm-gray/30 mx-auto mb-3" />
          <p className="text-warm-gray font-medium">No notes yet</p>
          <p className="text-sm text-warm-gray/60 mt-1">
            Staff notes, observations, and updates will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {fieldNotes.map((n) => (
            <div
              key={n.id}
              className="bg-white rounded-xl border border-card-border p-4 flex items-start gap-3 group"
            >
              <div className="flex-1">
                <p className="text-sm text-charcoal whitespace-pre-line">{n.text}</p>
                <p className="text-[11px] text-warm-gray/60 mt-1">
                  {n.timestamp.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
              <button
                onClick={() => removeEntry(n.id)}
                title="Delete note"
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-warm-gray/50 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
