"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  const slug = params.name as string;
  const animal = getAnimalBySlug(slug);

  const [activeTab, setActiveTab] = useState("overview");
  const [editing, setEditing] = useState(false);

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

            {/* Tags */}
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
      </div>
    </div>
  );
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

function MedicalTab({ animal }: { animal: Animal }) {
  const records = getRecordsForAnimal(animal.name);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-charcoal">
          Medical Records
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
          + Add Record
        </a>
      </div>

      {records.length === 0 ? (
        <div className="bg-white rounded-xl border border-card-border p-8 text-center">
          <Stethoscope className="w-8 h-8 text-warm-gray/30 mx-auto mb-3" />
          <p className="text-warm-gray font-medium">No medical records yet</p>
          <p className="text-sm text-warm-gray/60 mt-1">
            Add vet visits, lab results, and medications from the{" "}
            <a href="/app/medical" className="text-sky-600 hover:underline">
              Medical Dashboard
            </a>
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <div
              key={record.id}
              className={`bg-white rounded-xl border p-4 flex items-start gap-4 ${
                record.urgent
                  ? "border-red-200 bg-red-50/30"
                  : "border-card-border"
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
                <p className="font-semibold text-charcoal text-sm">
                  {record.title}
                </p>
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

      {/* Note input for AI extraction later */}
      <div className="bg-white rounded-xl border border-card-border p-5">
        <h4 className="font-semibold text-charcoal text-sm mb-3">
          Add Relationship Note
        </h4>
        <textarea
          placeholder="e.g., Pink and Eli are inseparable — born one day apart, nursed by each other's moms..."
          rows={3}
          className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal leading-relaxed focus:outline-none focus:ring-2 focus:ring-sand/50 mb-3"
        />
        <button className="px-4 py-2 bg-sidebar text-white rounded-lg text-sm font-medium hover:bg-sidebar-light transition-colors">
          Save Note
        </button>
      </div>
    </div>
  );
}

/* ── Photos Tab ── */
function PhotosTab({ animal }: { animal: Animal }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-charcoal">Photos</h3>
        <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-sidebar text-white rounded-lg text-sm font-medium hover:bg-sidebar-light transition-colors">
          + Upload Photo
        </button>
      </div>

      {animal.galleryImages && animal.galleryImages.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {animal.galleryImages.map((img, i) => (
            <div
              key={i}
              className="aspect-square rounded-xl overflow-hidden bg-cream border border-card-border"
            >
              <img
                src={img}
                alt={`${animal.name} photo ${i + 1}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
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
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-charcoal">Field Notes</h3>
      </div>

      {/* New note */}
      <div className="bg-white rounded-xl border border-card-border p-5">
        <textarea
          placeholder={`Add a note about ${animal.name}...`}
          rows={3}
          className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal leading-relaxed focus:outline-none focus:ring-2 focus:ring-sand/50 mb-3"
        />
        <button className="px-4 py-2 bg-sidebar text-white rounded-lg text-sm font-medium hover:bg-sidebar-light transition-colors">
          Save Note
        </button>
      </div>

      {/* Placeholder notes */}
      <div className="bg-white rounded-xl border border-card-border p-8 text-center">
        <StickyNote className="w-8 h-8 text-warm-gray/30 mx-auto mb-3" />
        <p className="text-warm-gray font-medium">No notes yet</p>
        <p className="text-sm text-warm-gray/60 mt-1">
          Staff notes, observations, and updates will appear here
        </p>
      </div>
    </div>
  );
}
