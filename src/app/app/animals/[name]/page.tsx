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
  Trash2,
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
import { useToast } from "@/lib/toast-context";
import { formatDate as sharedFormatDate } from "@/lib/format-date";
import { visitHistory } from "@/lib/hoof-dental-data";
import { getTrimProfile, type TrimProfile } from "@/lib/trimming-data";
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

  // Draft state for fields editable via the profile's "Edit Profile" toggle.
  // We seed from the current animal on mount and on each editing→true flip
  // so cancelled edits don't persist in memory. On Save we PATCH the diff to
  // /api/animals and toast the result.
  type ProfileDraft = {
    tagline: string;
    behavioralNotes: string;
    story: string; // newline-joined for the textarea
    traits: string; // comma-joined
    bestFriends: string; // comma-joined
  };
  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const { toastSuccess: profileToastSuccess, toastError: profileToastError } = useToast();

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
        <div className="flex items-center gap-2">
          {editing && (
            <button
              onClick={() => {
                setEditing(false);
                setDraft(null);
              }}
              disabled={savingProfile}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-white border border-card-border text-charcoal hover:bg-cream transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={async () => {
              if (!editing) {
                // Entering edit mode — seed drafts from the current animal.
                setDraft({
                  tagline: animal.tagline ?? "",
                  behavioralNotes: animal.behavioralNotes ?? "",
                  story: (animal.story ?? []).join("\n\n"),
                  traits: (animal.traits ?? []).join(", "),
                  bestFriends: (animal.bestFriends ?? []).join(", "),
                });
                setEditing(true);
                return;
              }
              // Save: PATCH only the fields the user edited.
              if (!draft) {
                setEditing(false);
                return;
              }
              setSavingProfile(true);
              try {
                const splitList = (s: string) =>
                  s.split(",").map((x) => x.trim()).filter(Boolean);
                const splitStory = (s: string) =>
                  s.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
                const payload: Record<string, unknown> = { name: animal.name };
                if (draft.tagline !== (animal.tagline ?? ""))
                  payload.tagline = draft.tagline;
                if (draft.behavioralNotes !== (animal.behavioralNotes ?? ""))
                  payload.behavioralNotes = draft.behavioralNotes;
                const nextTraits = splitList(draft.traits);
                if (nextTraits.join("|") !== (animal.traits ?? []).join("|"))
                  payload.traits = nextTraits;
                const nextFriends = splitList(draft.bestFriends);
                if (
                  nextFriends.join("|") !== (animal.bestFriends ?? []).join("|")
                )
                  payload.bestFriends = nextFriends;
                const nextStory = splitStory(draft.story);
                if (nextStory.join("|") !== (animal.story ?? []).join("|"))
                  payload.story = nextStory;
                if (Object.keys(payload).length <= 1) {
                  // No changes to save — just exit edit mode.
                  setEditing(false);
                  setDraft(null);
                  return;
                }
                const res = await fetch("/api/animals", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                });
                if (!res.ok) {
                  const body = await res.json().catch(() => ({}));
                  profileToastError(body?.error ?? "Failed to save profile.");
                  return;
                }
                profileToastSuccess(`Saved ${animal.name}'s profile.`);
                setEditing(false);
                setDraft(null);
                // NOTE: the in-memory animals list won't pick up these changes
                // until reload. That's an existing architectural limitation —
                // animals.ts exports a snapshot at boot.
              } finally {
                setSavingProfile(false);
              }
            }}
            disabled={savingProfile}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              editing
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-white border border-card-border text-charcoal hover:bg-cream"
            }`}
          >
            {editing ? (
              <>
                <Save className="w-4 h-4" />
                {savingProfile ? "Saving…" : "Save Changes"}
              </>
            ) : (
              <>
                <Pencil className="w-4 h-4" />
                Edit Profile
              </>
            )}
          </button>
        </div>
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
            {editing && draft ? (
              <input
                value={draft.tagline}
                onChange={(e) => setDraft({ ...draft, tagline: e.target.value })}
                placeholder="One-line tagline"
                className="w-full mb-4 px-3 py-2 text-sm border border-card-border rounded-lg text-warm-gray focus:outline-none focus:ring-2 focus:ring-sand/50"
              />
            ) : (
              <p className="text-warm-gray mb-4">{animal.tagline}</p>
            )}

            {/* Quick info grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
              <InfoItem label="Age" value={animal.age} editing={editing} />
              <InfoItem label="Sex" value={animal.sex} editing={editing} />
              <InfoItem label="Origin" value={animal.origin} editing={editing} />
              <InfoItem label="Herd" value={animal.herd} editing={editing} />
              <InfoItem label="Enclosure" value={animal.pen} editing={editing} />
              <InfoItem label="Intake Date" value={animal.intakeDate} editing={editing} />
              <InfoItem label="Adopted From" value={animal.adoptedFrom} editing={editing} />
            </div>

            {/* Hoof / Dental at-a-glance summary */}
            <HoofDentalSummary animal={animal} />

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
        {activeTab === "overview" && (
          <OverviewTab
            animal={animal}
            editing={editing}
            draft={draft}
            setDraft={setDraft}
          />
        )}
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
type ProfileDraftShape = {
  tagline: string;
  behavioralNotes: string;
  story: string;
  traits: string;
  bestFriends: string;
};

function OverviewTab({
  animal,
  editing,
  draft,
  setDraft,
}: {
  animal: Animal;
  editing: boolean;
  draft: ProfileDraftShape | null;
  setDraft: (d: ProfileDraftShape | null) => void;
}) {
  // In edit mode, `draft` is guaranteed to be populated by the parent. This
  // local accessor just simplifies the input `onChange` handlers.
  const patchDraft = (patch: Partial<ProfileDraftShape>) => {
    if (!draft) return;
    setDraft({ ...draft, ...patch });
  };

  return (
    <div className="space-y-6">
      {/* Adoption & Identity rendered FIRST per the dev team's request — */}
      {/* it's the most-referenced reference data and used to be tucked at  */}
      {/* the bottom of the right column. Now full-width above the story.  */}
      <AdoptionInfoCard animal={animal} />

      <div className="grid md:grid-cols-2 gap-6">
        {/* Story */}
        <div className="bg-white rounded-xl border border-card-border p-5">
          <h3 className="font-bold text-charcoal mb-3">Origin Story</h3>
        {editing && draft ? (
          <textarea
            value={draft.story}
            onChange={(e) => patchDraft({ story: e.target.value })}
            rows={8}
            placeholder="Paragraphs separated by a blank line…"
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
          {editing && draft ? (
            <input
              value={draft.traits}
              onChange={(e) => patchDraft({ traits: e.target.value })}
              placeholder="Comma-separated (Calm, Nurturing, Leader…)"
              className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
            />
          ) : (
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
          )}
        </div>

        <div className="bg-white rounded-xl border border-card-border p-5">
          <h3 className="font-bold text-charcoal mb-3">Behavioral Notes</h3>
          {editing && draft ? (
            <textarea
              value={draft.behavioralNotes}
              onChange={(e) => patchDraft({ behavioralNotes: e.target.value })}
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

        {/* Relationships — three groups: Parents, Children, Friends. Replaces */}
        {/* the old "Best Friends" card. Parents and Children come from the    */}
        {/* adoption CSV's parsed Notes (read-only here — they reflect family  */}
        {/* tree from the source data). Friends is the editable list (was the  */}
        {/* `bestFriends` field) and uses the comma-separated input on edit.  */}
        <div className="bg-white rounded-xl border border-card-border p-5 space-y-3">
          <h3 className="font-bold text-charcoal">Relationships</h3>

          {animal.parents && animal.parents.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-1.5">
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
              <p className="text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-1.5">
                {animal.children.length === 1 ? "Child" : "Children"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {animal.children.map((c) => (
                  <FamilyChip key={c} name={c} />
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-1.5">
              Friends
            </p>
            {editing && draft ? (
              <input
                value={draft.bestFriends}
                onChange={(e) => patchDraft({ bestFriends: e.target.value })}
                placeholder="Comma-separated donkey names (Pink, Eli…)"
                className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
              />
            ) : animal.bestFriends.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
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
            ) : (
              <p className="text-sm text-warm-gray/60 italic">No friends recorded yet.</p>
            )}
          </div>
        </div>
          {/* Sponsor info */}
          <SponsorCard animal={animal} />
          {/* AdoptionInfoCard is now rendered at the top of OverviewTab */}
          {/* (full-width, above the two-column story+traits layout). */}
        </div>
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
  // Family members (parents/children/bondedWith) used to render here too,
  // but per the dev team's "Bonds & Relationships" restructure they live in
  // the Relationships card on the right column instead.
  if (!hasIdentity) return null;

  return (
    <div className="bg-white rounded-xl border border-card-border p-5 space-y-4">
      <h3 className="font-bold text-charcoal">Adoption & Identity</h3>
      <div className="grid grid-cols-2 gap-3">
        {animal.birthDate && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-0.5">
              Birth Date
            </p>
            <p className="text-base font-medium text-charcoal">
              {sharedFormatDate(animal.birthDate)}
            </p>
          </div>
        )}
        {animal.color && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-0.5">
              Color
            </p>
            <p className="text-base font-medium text-charcoal">{animal.color}</p>
          </div>
        )}
        {animal.size && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-0.5">
              Size
            </p>
            <p className="text-base font-medium text-charcoal">{animal.size}</p>
          </div>
        )}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-0.5">
            Microchip
          </p>
          {animal.microchip ? (
            <p className="text-sm font-mono text-charcoal break-all">
              {animal.microchip}
            </p>
          ) : (
            <p className="text-sm font-medium text-orange-600">Needs chip</p>
          )}
        </div>
      </div>
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

  // Local alias for readability — re-uses the centralized MM-DD-YYYY helper.
  const formatDate = (iso: string) => sharedFormatDate(iso);

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

// Re-export so JSX call sites don't need to change.
const formatRecordDate = sharedFormatDate;

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
  const { updateEntry, removeEntry } = useMedical();
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(record.title);
  const [draftDate, setDraftDate] = useState(record.date);
  const [draftDesc, setDraftDesc] = useState(record.description ?? "");
  const [busy, setBusy] = useState(false);

  // CSV-sourced records (annual exams, yard-wide dewormings) can't be edited
  // — they don't have editable DB rows. Detect by id prefix so the pencil /
  // trash buttons only appear on real DB entries.
  const isEditable =
    !record.id.startsWith("med-exam-") &&
    !record.id.startsWith("yard-med-") &&
    !record.id.startsWith("med-import-") &&
    !record.id.startsWith("scheduled-vacc-");

  async function handleSave() {
    setBusy(true);
    try {
      await updateEntry(record.id, {
        title: draftTitle.trim() || record.title,
        date: draftDate || record.date,
        description: draftDesc,
      });
      setEditing(false);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete this ${record.type} entry? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await removeEntry(record.id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`bg-white rounded-xl border p-4 flex items-start gap-4 group ${
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
        {editing ? (
          <div className="space-y-2 mt-1">
            <input
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-card-border rounded-md focus:outline-none focus:ring-1 focus:ring-sky"
              placeholder="Title"
            />
            <input
              type="date"
              value={draftDate}
              onChange={(e) => setDraftDate(e.target.value)}
              className="w-full px-2 py-1 text-xs border border-card-border rounded-md focus:outline-none focus:ring-1 focus:ring-sky"
            />
            <textarea
              value={draftDesc}
              onChange={(e) => setDraftDesc(e.target.value)}
              rows={2}
              className="w-full px-2 py-1 text-sm border border-card-border rounded-md focus:outline-none focus:ring-1 focus:ring-sky resize-none"
              placeholder="Description"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={busy}
                className="px-3 py-1 text-xs font-semibold bg-emerald-500 text-white rounded-md hover:bg-emerald-600 disabled:opacity-40"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setDraftTitle(record.title);
                  setDraftDate(record.date);
                  setDraftDesc(record.description ?? "");
                  setEditing(false);
                }}
                className="px-3 py-1 text-xs font-semibold bg-white border border-card-border text-charcoal rounded-md hover:bg-cream"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="font-semibold text-charcoal text-sm">{record.title}</p>
            <p className="text-xs text-warm-gray mt-0.5">
              {formatRecordDate(record.date)}
            </p>
            {record.description && (
              <p className="text-sm text-warm-gray mt-2 leading-relaxed">
                {record.description}
              </p>
            )}
            {/* Photos for x-rays, injury pics, etc. The same TrimPhotos
                component (it's keyed by any string id, not specifically a
                trim) — we namespace medical entries with `med-` so the
                photo store doesn't collide with the trim entries. */}
            <TrimPhotos visitId={`med-${record.id}`} />
          </>
        )}
      </div>
      {isEditable && !editing && (
        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 text-warm-gray hover:text-sky hover:bg-sky/10 rounded"
            title="Edit entry"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            disabled={busy}
            className="p-1.5 text-warm-gray hover:text-red-500 hover:bg-red-50 rounded disabled:opacity-40"
            title="Delete entry"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
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
  const [showAllTrims, setShowAllTrims] = useState(false);

  const hoofVisits = visitHistory
    .filter((v) => v.animal === animal.name && v.type === "hoof")
    .sort((a, b) => b.date.localeCompare(a.date));
  const trimProfile = getTrimProfile(animal.name);
  const visibleTrims = showAllTrims ? hoofVisits : hoofVisits.slice(0, 5);
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
          href={`/app/medical?animal=${encodeURIComponent(animal.name)}&open=1${
            subTab === "vaccinations"
              ? "&type=Vaccination"
              : subTab === "deworming"
                ? "&type=Deworming"
                : subTab === "fecal-tests"
                  ? "&type=Fecal+Test"
                  : ""
          }`}
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

          {/* Editable trim profile cards. CSV defaults can be overridden
              per donkey via /api/trim-profiles. */}
          <TrimProfileEditor
            animalName={animal.name}
            csvProfile={trimProfile}
          />

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
            <>
              <div className="space-y-2">
                {visibleTrims.map((visit) => (
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
              {hoofVisits.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllTrims((v) => !v)}
                  className="mt-2 w-full text-center text-xs font-medium text-sky-600 hover:text-sky-700 hover:underline py-2"
                >
                  {showAllTrims
                    ? "Show fewer"
                    : `Show all ${hoofVisits.length} trims`}
                </button>
              )}
            </>
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
                  {sharedFormatDate(n.timestamp)}
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

// ══════════════════════════════════════════
// ── Hoof & Dental at-a-glance summary (on the profile header)
// ══════════════════════════════════════════
function HoofDentalSummary({ animal }: { animal: Animal }) {
  // Last-visit dates come from the merged visitHistory (CSV seeds + any DB
  // visits). Next-due dates are live from the API since the in-memory
  // animals snapshot doesn't carry them.
  const hoofVisits = visitHistory
    .filter((v) => v.animal === animal.name && v.type === "hoof")
    .sort((a, b) => b.date.localeCompare(a.date));
  const dentalVisits = visitHistory
    .filter((v) => v.animal === animal.name && v.type === "dental")
    .sort((a, b) => b.date.localeCompare(a.date));

  const lastHoof = hoofVisits[0]?.date ?? null;
  const lastDental = dentalVisits[0]?.date ?? null;

  const [nextHoof, setNextHoof] = useState<string | null>(
    animal.nextHoofDue ?? null
  );
  const [nextDental, setNextDental] = useState<string | null>(
    animal.nextDentalDue ?? null
  );
  useEffect(() => {
    let cancelled = false;
    async function fetchDueDates() {
      try {
        const [hoofRes, dentalRes] = await Promise.all([
          fetch(`/api/hoof-visits?animal=${encodeURIComponent(animal.name)}`, {
            cache: "no-store",
          }),
          fetch(`/api/dental-visits?animal=${encodeURIComponent(animal.name)}`, {
            cache: "no-store",
          }),
        ]);
        if (hoofRes.ok) {
          const data = await hoofRes.json();
          if (!cancelled) setNextHoof(data?.nextDue?.[animal.name] ?? null);
        }
        if (dentalRes.ok) {
          const data = await dentalRes.json();
          if (!cancelled) setNextDental(data?.nextDue?.[animal.name] ?? null);
        }
      } catch {
        // Stay with the seeded values silently; the summary still renders.
      }
    }
    void fetchDueDates();
    return () => {
      cancelled = true;
    };
  }, [animal.name]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntil = (iso: string | null) => {
    if (!iso) return null;
    const d = new Date(iso + "T00:00:00");
    return Math.round((d.getTime() - today.getTime()) / 86_400_000);
  };
  const hoofDays = daysUntil(nextHoof);
  const dentalDays = daysUntil(nextDental);

  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      <SummaryTile
        label="Hoof"
        lastDate={lastHoof}
        nextDate={nextHoof}
        daysUntil={hoofDays}
      />
      <SummaryTile
        label="Dental"
        lastDate={lastDental}
        nextDate={nextDental}
        daysUntil={dentalDays}
      />
    </div>
  );
}

function SummaryTile({
  label,
  lastDate,
  nextDate,
  daysUntil,
}: {
  label: string;
  lastDate: string | null;
  nextDate: string | null;
  daysUntil: number | null;
}) {
  const overdue = daysUntil !== null && daysUntil < 0;
  const dueSoon = daysUntil !== null && daysUntil >= 0 && daysUntil <= 14;

  return (
    <div
      className={`rounded-lg border p-3 ${
        overdue
          ? "bg-red-50 border-red-200"
          : dueSoon
            ? "bg-amber-50 border-amber-200"
            : "bg-cream/50 border-card-border"
      }`}
    >
      <p
        className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${
          overdue
            ? "text-red-700"
            : dueSoon
              ? "text-amber-700"
              : "text-warm-gray/70"
        }`}
      >
        {label}
      </p>
      <div className="flex flex-col gap-0.5 text-xs">
        <span className="text-charcoal">
          <span className="text-warm-gray/70">Last:</span>{" "}
          {lastDate ? formatRecordDate(lastDate) : "—"}
        </span>
        <span className="text-charcoal">
          <span className="text-warm-gray/70">Next:</span>{" "}
          {nextDate ? (
            <>
              {formatRecordDate(nextDate)}
              {daysUntil !== null && (
                <span
                  className={`ml-1 font-semibold ${
                    overdue
                      ? "text-red-700"
                      : dueSoon
                        ? "text-amber-700"
                        : "text-warm-gray"
                  }`}
                >
                  {overdue
                    ? `(${Math.abs(daysUntil)}d overdue)`
                    : daysUntil === 0
                      ? "(today)"
                      : `(in ${daysUntil}d)`}
                </span>
              )}
            </>
          ) : (
            "—"
          )}
        </span>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// ── Trim Profile Editor
// ══════════════════════════════════════════
//
// Renders the four trim-protocol cards plus the training-progress card with
// inline edit + save. CSV defaults (from /lib/trimming-data) are the seed
// values; the user can override any field, which persists to the
// TrimProfileOverride DB table via /api/trim-profiles. Empty edits clear
// the override and fall back to the CSV.
function TrimProfileEditor({
  animalName,
  csvProfile,
}: {
  animalName: string;
  csvProfile: TrimProfile | null;
}) {
  const [override, setOverride] = useState<{
    preTrimTreatment: string | null;
    protocols: string | null;
    squishPads: string | null;
    recentNotes: string | null;
    trainingNotes: string | null;
  } | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    protocols: "",
    preTrimTreatment: "",
    squishPads: "",
    recentNotes: "",
    trainingNotes: "",
  });
  const { toastSuccess, toastError } = useToast();

  // Hydrate the override on mount (and when the animal changes).
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/trim-profiles?animal=${encodeURIComponent(animalName)}`,
          { cache: "no-store" }
        );
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled) setOverride(data?.override ?? null);
      } catch {
        // Silent — the read-only display still works from the CSV.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [animalName]);

  // Effective values: override field wins if set (non-null AND non-empty),
  // otherwise fall back to the CSV.
  const eff = {
    protocols: override?.protocols ?? csvProfile?.protocols ?? "",
    preTrimTreatment:
      override?.preTrimTreatment ?? csvProfile?.preTrimTreatment ?? "",
    squishPads: override?.squishPads ?? csvProfile?.squishPads ?? "",
    recentNotes: override?.recentNotes ?? csvProfile?.recentNotes ?? "",
    trainingNotes: override?.trainingNotes ?? csvProfile?.trainingNotes ?? "",
  };

  const startEditing = () => {
    setDraft({ ...eff });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/trim-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animal: animalName,
          ...draft,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toastError(body?.error ?? "Failed to save trim profile.");
        return;
      }
      const data = await res.json();
      setOverride(data?.override ?? null);
      setEditing(false);
      toastSuccess(`Saved ${animalName}'s trim protocols.`);
    } finally {
      setSaving(false);
    }
  };

  const trainingDate = csvProfile?.trainingDate ?? null;

  // Nothing to show? Render an empty-state with an Edit button so staff can
  // start a fresh override even when no CSV row exists.
  const hasAnyContent =
    eff.protocols ||
    eff.preTrimTreatment ||
    eff.squishPads ||
    eff.recentNotes ||
    eff.trainingNotes ||
    trainingDate;

  if (!editing && !hasAnyContent) {
    return (
      <button
        onClick={startEditing}
        className="w-full bg-white rounded-xl border border-dashed border-card-border p-4 text-sm text-warm-gray/70 hover:border-sand hover:text-charcoal transition-colors"
      >
        + Add trim and training protocols
      </button>
    );
  }

  if (editing) {
    return (
      <div className="bg-white rounded-xl border border-card-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-bold text-sm text-charcoal">Edit Trim &amp; Training</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing(false)}
              className="text-xs text-warm-gray hover:text-charcoal"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={() => void handleSave()}
              disabled={saving}
              className="px-3 py-1 text-xs font-semibold bg-emerald-500 text-white rounded-md hover:bg-emerald-600 disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
        <EditField
          label="Trimming Protocols"
          value={draft.protocols}
          onChange={(v) => setDraft((d) => ({ ...d, protocols: v }))}
          rows={3}
        />
        <EditField
          label="Pre-Trim Treatment"
          value={draft.preTrimTreatment}
          onChange={(v) => setDraft((d) => ({ ...d, preTrimTreatment: v }))}
          rows={2}
        />
        <EditField
          label="Squish Pads"
          value={draft.squishPads}
          onChange={(v) => setDraft((d) => ({ ...d, squishPads: v }))}
          rows={2}
        />
        <EditField
          label="Notes from Recent Trim"
          value={draft.recentNotes}
          onChange={(v) => setDraft((d) => ({ ...d, recentNotes: v }))}
          rows={2}
        />
        <EditField
          label="Training Progress"
          value={draft.trainingNotes}
          onChange={(v) => setDraft((d) => ({ ...d, trainingNotes: v }))}
          rows={3}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <button
          onClick={startEditing}
          className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-700"
        >
          <Pencil className="w-3 h-3" />
          Edit protocols
        </button>
      </div>
      {eff.protocols && (
        <ProtocolCard label="Trimming Protocols" value={eff.protocols} />
      )}
      {eff.preTrimTreatment && (
        <ProtocolCard label="Pre-Trim Treatment" value={eff.preTrimTreatment} />
      )}
      {eff.squishPads && <ProtocolCard label="Squish Pads" value={eff.squishPads} />}
      {eff.recentNotes && (
        <ProtocolCard label="Notes from Recent Trim" value={eff.recentNotes} />
      )}
      {(trainingDate || eff.trainingNotes) && (
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
          <div className="flex items-baseline justify-between mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-700/80">
              Training Progress
            </p>
            {trainingDate && (
              <p className="text-xs text-sky-700/70">
                Last session: {sharedFormatDate(trainingDate)}
              </p>
            )}
          </div>
          {eff.trainingNotes && (
            <p className="text-sm text-charcoal leading-relaxed whitespace-pre-wrap">
              {eff.trainingNotes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ProtocolCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-card-border p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-warm-gray/60 mb-2">
        {label}
      </p>
      <p className="text-sm text-charcoal leading-relaxed whitespace-pre-wrap">
        {value}
      </p>
    </div>
  );
}

function EditField({
  label,
  value,
  onChange,
  rows,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows: number;
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-wider text-warm-gray/60 block mb-1">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full px-2 py-1.5 text-sm border border-card-border rounded-md focus:outline-none focus:ring-1 focus:ring-sky resize-none"
        placeholder={`Add ${label.toLowerCase()} for this donkey…`}
      />
    </div>
  );
}
