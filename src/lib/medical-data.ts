// ── Centralized Medical Entries for the Sanctuary ──

export type MedicalEntryType =
  | "Vet Visit"
  | "Hoof & Dental"
  | "Medication"
  | "Lab Result"
  | "Temperature"
  | "Weight"
  | "Vaccination"
  | "Deworming"
  | "Fecal Test";

export interface MedicalEntry {
  id: string;
  animal: string;
  type: MedicalEntryType;
  title: string;
  date: string; // ISO date string YYYY-MM-DD
  description: string;
  urgent: boolean;
}

// Backwards-compatible aliases
export type MedicalRecordType = MedicalEntryType;
export type MedicalRecord = MedicalEntry;

export const entryTypes: MedicalEntryType[] = [
  "Vet Visit",
  "Hoof & Dental",
  "Medication",
  "Lab Result",
  "Temperature",
  "Weight",
  "Vaccination",
  "Deworming",
  "Fecal Test",
];

export const recordTypes = entryTypes;

export const typeBadgeColors: Record<
  MedicalEntryType,
  { bg: string; text: string }
> = {
  "Vet Visit": { bg: "bg-sky-100", text: "text-sky-700" },
  "Hoof & Dental": { bg: "bg-amber-100", text: "text-amber-700" },
  Medication: { bg: "bg-purple-100", text: "text-purple-700" },
  "Lab Result": { bg: "bg-emerald-100", text: "text-emerald-700" },
  Temperature: { bg: "bg-red-100", text: "text-red-700" },
  Weight: { bg: "bg-slate-100", text: "text-slate-700" },
  Vaccination: { bg: "bg-green-100", text: "text-green-700" },
  Deworming: { bg: "bg-orange-100", text: "text-orange-700" },
  "Fecal Test": { bg: "bg-teal-100", text: "text-teal-700" },
};

let nextId = 1;
function rec(
  animal: string,
  type: MedicalRecordType,
  title: string,
  date: string,
  description: string,
  urgent = false
): MedicalEntry {
  return {
    id: `med-${nextId++}`,
    animal,
    type,
    title,
    date,
    description,
    urgent,
  };
}

export const medicalEntries: MedicalEntry[] = [
  // ── Shelley — Leg & Special Needs ──
  rec("Shelley", "Vet Visit", "Leg assessment — Dr. Moreno", "2025-10-08", "Full evaluation of deformed front leg. Leg continues to grow longer, requiring adjusted brace protocol. Recommend continuing daily bandage routine."),
  rec("Shelley", "Medication", "Pain management — Bute adjustment", "2025-10-15", "Increased phenylbutazone from 1g to 1.5g daily due to increased lameness observed. Monitor appetite and GI."),
  rec("Shelley", "Hoof & Dental", "Hoof trim — corrective", "2025-10-22", "Corrective trim on all four hooves. Front left requires more aggressive angle to compensate for leg deformity. Good cooperation."),
  rec("Shelley", "Vet Visit", "Leg brace fitting — new brace", "2025-11-05", "New custom brace fitted by orthotics team. Better weight distribution. Brace on at 5pm, remove and clean at lunch per protocol."),
  rec("Shelley", "Medication", "Bandage change — leg wrap", "2025-11-19", "Routine bandage change. Mild skin irritation under wrap — applied zinc oxide barrier cream. Skin otherwise healthy."),
  rec("Shelley", "Vet Visit", "Quarterly wellness check", "2025-12-10", "Overall good health for age and condition. Weight stable at 420 lbs. Heart and lungs clear. Continue current care protocol.", false),
  rec("Shelley", "Hoof & Dental", "Hoof trim — routine", "2025-12-20", "Routine trim. Hooves in fair condition. Front left showing expected asymmetric wear from brace."),
  rec("Shelley", "Medication", "Bandage change + brace adjustment", "2026-01-08", "Brace hinge loosened — tightened. Bandage changed, skin healthy. Shelley very patient during procedure.", true),
  rec("Shelley", "Vet Visit", "Leg check — swelling noted", "2026-02-12", "Mild edema above brace line. Added cold compress 2x daily for 5 days. Recheck in one week.", true),
  rec("Shelley", "Vet Visit", "Leg recheck — swelling resolved", "2026-02-19", "Swelling resolved with cold compress protocol. Resume normal brace schedule."),
  rec("Shelley", "Hoof & Dental", "Hoof trim", "2026-03-05", "Routine corrective trim. Good hoof wall quality this cycle."),

  // ── Gabriel — Prosthetic & Growth ──
  rec("Gabriel", "Vet Visit", "Prosthetic fitting — growth adjustment", "2025-10-12", "Gabriel has grown 2 inches since last fitting. Prosthetic socket remolded. Excellent skin condition at interface."),
  rec("Gabriel", "Medication", "Daily bandage check — prosthetic site", "2025-10-20", "Routine bandage check. No redness or pressure sores. Skin healthy. Bandage replaced with fresh wrap."),
  rec("Gabriel", "Weight", "Growth monitoring — weight check", "2025-11-01", "Weight: 285 lbs (up 12 lbs from last month). Growth rate healthy for age. Adjust prosthetic alignment at next fitting."),
  rec("Gabriel", "Vet Visit", "Prosthetic recheck — Dr. Simmons", "2025-11-18", "Prosthetic wearing evenly. Gait analysis shows improved symmetry. Continue daily bandage protocol. Next full fitting in 8 weeks."),
  rec("Gabriel", "Vaccination", "Annual vaccinations", "2025-12-01", "West Nile, Tetanus, EEE/WEE, Rabies. No adverse reactions. Monitored for 30 minutes post-injection."),
  rec("Gabriel", "Medication", "Bandage change — minor abrasion", "2025-12-15", "Small abrasion at prosthetic margin. Cleaned with saline, applied wound cream. Not concerning but monitor daily.", true),
  rec("Gabriel", "Weight", "Growth check", "2026-01-05", "Weight: 298 lbs. Steady growth. Height measured at 10.2 hands."),
  rec("Gabriel", "Vet Visit", "Prosthetic fitting — new socket", "2026-01-22", "New socket fabricated. Growth spurt requiring earlier replacement than expected. Good adaptation within first hour of fitting."),
  rec("Gabriel", "Medication", "Bandage change — routine", "2026-02-10", "Clean site. No issues. Gabriel increasingly tolerant of procedure — barely moves now."),
  rec("Gabriel", "Weight", "Monthly weight check", "2026-03-01", "Weight: 312 lbs. Height: 10.4 hands. Growing well."),
  rec("Gabriel", "Vet Visit", "Prosthetic alignment check", "2026-03-20", "Slight lateral drift in alignment corrected. Gait improving steadily. Asher staying close during exam as usual."),

  // ── Winnie — Twisted Legs ──
  rec("Winnie", "Hoof & Dental", "Hoof care — corrective trim", "2025-10-18", "Corrective trim accounting for twisted front legs. Slow and careful — Winnie very trusting throughout. Good hoof wall integrity."),
  rec("Winnie", "Vet Visit", "Mobility assessment", "2025-11-10", "Annual mobility evaluation. Walking pace stable. No deterioration in gait. Recommend continuing current hoof schedule every 5-6 weeks."),
  rec("Winnie", "Hoof & Dental", "Hoof trim", "2025-12-02", "Routine corrective trim. Both front hooves trimmed to maintain optimal angles for her conformation."),
  rec("Winnie", "Vet Visit", "Wellness check", "2026-01-15", "Heart, lungs, teeth all normal. Good body condition score (3.5/5). Continue current management."),
  rec("Winnie", "Hoof & Dental", "Hoof trim", "2026-02-08", "Trim went smoothly. Hoof quality excellent this winter. Winnie nudged farrier for treats afterward."),
  rec("Winnie", "Hoof & Dental", "Hoof trim — due soon", "2026-04-05", "Scheduled corrective hoof trim. Last trim was Feb 8 — approaching 8-week mark.", true),

  // ── Cassidy — Corrective Hooves ──
  rec("Cassidy", "Hoof & Dental", "Corrective hoof trim", "2025-10-25", "Major corrective work on all four hooves. Significant improvement since intake. Right front still needs most attention."),
  rec("Cassidy", "Vet Visit", "Hoof therapy progress check", "2025-11-20", "Dr. Moreno pleased with progress. Hooves responding well to corrective trimming schedule. Continue daily 15-min therapy walks."),
  rec("Cassidy", "Hoof & Dental", "Corrective hoof trim", "2025-12-12", "Second corrective cycle. Angles improving. Right front approaching normal range. Cassidy very patient."),
  rec("Cassidy", "Hoof & Dental", "Corrective hoof trim", "2026-01-28", "Good progress. All hooves now within acceptable angles. Moving to 8-week trim schedule from 6-week."),
  rec("Cassidy", "Hoof & Dental", "Afternoon hoof soak", "2026-02-20", "Routine Epsom salt hoof soak. No signs of thrush or white line disease. Healthy frog tissue."),
  rec("Cassidy", "Hoof & Dental", "Corrective hoof trim", "2026-03-18", "Maintaining good angles. Farrier reports Cassidy is one of the most improved hoarding rescue cases."),

  // ── Seniors — Wellness & Dental ──
  rec("Edgar", "Vet Visit", "Senior wellness exam", "2025-10-30", "Comprehensive senior exam. Mild arthritis in hocks, otherwise excellent for 25-year-old. Continue joint supplements and soft mash diet."),
  rec("Edgar", "Hoof & Dental", "Dental float", "2025-11-15", "Annual dental float. Sharp points on upper molars filed. Mild wave mouth — monitor. Eating well post-procedure."),
  rec("Edgar", "Weight", "Weight check", "2025-12-05", "Weight: 520 lbs. Stable. Body condition score 3/5 — appropriate for senior."),
  rec("Edgar", "Medication", "Joint supplement — Adequan injection", "2026-01-10", "Monthly Adequan IM injection for arthritis management. No injection site reaction. Moving well today."),
  rec("Edgar", "Vet Visit", "Senior wellness — spring check", "2026-03-15", "Spring senior wellness. All vitals normal. Arthritis managed well with current protocol. Good appetite."),

  rec("Winky", "Vet Visit", "Senior wellness exam", "2025-11-02", "Annual senior exam. Blind eye (right) stable — no signs of infection. Left eye clear. Good overall condition for age."),
  rec("Winky", "Hoof & Dental", "Dental float", "2025-11-15", "Dental float performed. Minor hooks on lower premolars addressed. Ground-level feeding continues to work well."),
  rec("Winky", "Medication", "Eye flush — preventive", "2026-01-20", "Saline flush of blind eye socket area. No debris or irritation. Continue monitoring."),
  rec("Winky", "Vaccination", "Annual vaccinations", "2026-02-01", "West Nile, Tetanus, EEE/WEE, Rabies. Approached from left side per protocol. No adverse reactions."),

  rec("Swayze", "Vet Visit", "Arthritis assessment", "2025-10-20", "Hind leg arthritis evaluation. Mild progression since last year. Added Equioxx daily to joint supplement regimen."),
  rec("Swayze", "Medication", "Joint supplement — daily Equioxx", "2025-10-21", "Started daily Equioxx (firocoxib) for arthritis. Mix with AM feed. Monitor for GI side effects."),
  rec("Swayze", "Weight", "Weight check", "2026-01-12", "Weight: 490 lbs. Slight gain — adjust portions slightly. Body condition score 3.5/5."),
  rec("Swayze", "Hoof & Dental", "Hoof trim", "2026-02-15", "Routine trim. Farrier notes good hoof quality despite arthritis limiting movement."),

  rec("Blossom", "Hoof & Dental", "Dental examination", "2025-10-28", "Dental exam reveals two loose incisors and ongoing molar issues. Continue soft food only. Recheck in 3 months."),
  rec("Blossom", "Hoof & Dental", "Dental float + extraction", "2025-12-18", "Extracted one loose lower incisor under sedation. Dental float on remaining teeth. Recovery uneventful. Soft food only for 2 weeks post-procedure."),
  rec("Blossom", "Medication", "Oral spray — gum healing", "2025-12-19", "Chlorhexidine oral spray at breakfast for post-extraction healing. Continue for 7 days."),
  rec("Blossom", "Vet Visit", "Dental recheck", "2026-01-25", "Extraction site healed well. Remaining incisor still loose but stable for now. Eating soft food well."),
  rec("Blossom", "Hoof & Dental", "Dental recheck — due", "2026-04-01", "Scheduled 3-month dental recheck. Monitor remaining loose incisor.", true),

  rec("Tenzel", "Medication", "DMSO treatment — lunch", "2025-11-08", "Topical DMSO applied to left shoulder at lunch per whiteboard protocol. Mild inflammation in area. Continue daily."),
  rec("Tenzel", "Hoof & Dental", "Hoof trim", "2025-12-10", "Routine trim. Good hoof quality. Tenzel calm with farrier — mask off during procedure."),
  rec("Tenzel", "Vet Visit", "Senior wellness check", "2026-02-05", "Comprehensive senior check. Weight stable. Heart murmur — grade 1, unchanged. Continue monitoring. DMSO treatment working well for shoulder."),

  // ── Herman — Whiteboard Treatments ──
  rec("Herman", "Medication", "DMSO treatment — lunch protocol", "2025-10-14", "Topical DMSO applied as per whiteboard. Area around left fetlock showing improvement. Continue daily at lunch."),
  rec("Herman", "Hoof & Dental", "Hoof trim", "2025-11-25", "Routine trim. Mask on during procedure per protocol. No issues noted."),
  rec("Herman", "Medication", "DMSO treatment update", "2025-12-22", "Fetlock inflammation nearly resolved. Reducing DMSO to every other day. Recheck in 2 weeks."),
  rec("Herman", "Vet Visit", "Fetlock recheck", "2026-01-06", "Dr. Moreno confirms significant improvement. Continue every-other-day DMSO for one more month, then reassess."),
  rec("Herman", "Hoof & Dental", "Hoof trim", "2026-02-28", "Routine trim. Hooves in good condition. Herman cooperative with mask on."),

  // ── Draco & Jett — Skin Conditions ──
  rec("Draco", "Vet Visit", "Skin evaluation — fur loss", "2025-10-16", "Patches of fur loss on barrel and hindquarters. Skin scraping negative for mites. Suspect seasonal dermatitis. Start topical treatment."),
  rec("Draco", "Medication", "Daily topical treatment — skin", "2025-10-17", "Started daily topical antifungal + moisturizing treatment on affected areas. Apply at morning feed."),
  rec("Draco", "Lab Result", "Skin scraping results", "2025-10-22", "Lab confirms no fungal or parasitic cause. Likely allergic dermatitis. Continue topical treatment and add omega-3 supplement."),
  rec("Draco", "Vet Visit", "Skin recheck", "2025-12-01", "Fur regrowing well in most patches. One stubborn spot on right hip. Continue treatment on that area only."),
  rec("Draco", "Medication", "Topical treatment — ongoing", "2026-01-15", "Reduced to 3x weekly applications. Fur nearly fully regrown. Good response to omega-3 supplement."),
  rec("Draco", "Vet Visit", "Skin follow-up — resolved", "2026-03-10", "All patches fully resolved. Discontinue topical. Continue omega-3 through spring for prevention."),

  rec("Jett", "Vet Visit", "Skin evaluation — itching + fur loss", "2025-10-16", "Similar presentation to Draco. Fur loss on neck and shoulders with visible scratching. Start same topical protocol."),
  rec("Jett", "Medication", "Daily topical treatment — skin", "2025-10-17", "Antifungal + moisturizing topical on neck and shoulder patches. Apply at morning feed alongside Draco."),
  rec("Jett", "Lab Result", "Skin scraping results", "2025-10-22", "Negative for mites and fungal. Allergic dermatitis like Draco — may be environmental trigger in Dragon pen."),
  rec("Jett", "Vet Visit", "Skin recheck", "2025-12-01", "Improving but slower than Draco. Added antihistamine (hydroxyzine) to protocol for 14 days."),
  rec("Jett", "Medication", "Hydroxyzine — 14 day course", "2025-12-02", "Hydroxyzine 500mg 2x daily with feed. Monitor for sedation. Continue topical concurrently."),
  rec("Jett", "Vet Visit", "Skin recheck — improving", "2026-01-20", "Significant improvement after antihistamine course. Fur regrowing. Continue topical 3x weekly."),

  // ── Maku — Benadryl for Itchiness ──
  rec("Maku", "Vet Visit", "Itchiness evaluation", "2025-11-05", "Generalized itching, no fur loss yet. No mites on scraping. Likely seasonal allergies. Start Benadryl."),
  rec("Maku", "Medication", "Benadryl — allergy management", "2025-11-06", "Diphenhydramine (Benadryl) 250mg 2x daily in feed. Monitor effectiveness over 7 days."),
  rec("Maku", "Vet Visit", "Allergy recheck", "2025-12-08", "Benadryl controlling symptoms well. Continue as needed through allergy season. No fur loss developed."),
  rec("Maku", "Medication", "Benadryl — resumed spring", "2026-03-15", "Spring allergies returning. Resumed Benadryl 250mg 2x daily. Scratching on fence posts noted.", true),

  // ── Fernie — Bleeding Growth ──
  rec("Fernie", "Vet Visit", "Growth evaluation — bleeding mass", "2025-11-12", "Discovered bleeding growth on left barrel. Approximately 2cm diameter. Cleaned and bandaged. Biopsy taken."),
  rec("Fernie", "Lab Result", "Biopsy results — growth", "2025-11-20", "Biopsy returned as sarcoid (benign). Recommended monitoring and bandaging to prevent trauma. No surgical removal needed at this time."),
  rec("Fernie", "Medication", "Growth bandage change", "2025-12-05", "Bandage changed. Growth stable in size. No active bleeding today. Keeping area clean and protected."),
  rec("Fernie", "Vet Visit", "Growth recheck", "2026-01-18", "Growth unchanged — 2cm, no increase. Bandage protocol effective at preventing re-injury. Continue monitoring."),
  rec("Fernie", "Medication", "Growth bandage change", "2026-02-25", "Routine bandage change. Slight bleed on removal — stopped quickly. Area otherwise healthy."),
  rec("Fernie", "Vet Visit", "Growth monitoring — daily", "2026-03-22", "Assigned to Amber for daily monitoring. Growth slightly more vascular this month. Keep bandaged.", true),

  // ── Broad Hoof Trims — Many Donkeys ──
  rec("Pink", "Hoof & Dental", "Hoof trim — routine", "2025-10-10", "Routine trim. Healthy hooves. Pink stood perfectly, as always."),
  rec("Pink", "Hoof & Dental", "Hoof trim", "2025-12-08", "Routine trim. Good hoof wall. No issues."),
  rec("Pink", "Hoof & Dental", "Hoof trim", "2026-02-10", "Routine trim. Farrier complimented hoof quality."),

  rec("Eli", "Hoof & Dental", "Hoof trim", "2025-10-10", "Routine trim alongside Pink. Good hooves."),
  rec("Eli", "Hoof & Dental", "Hoof trim", "2025-12-08", "Routine trim. No issues."),
  rec("Eli", "Hoof & Dental", "Hoof trim", "2026-02-10", "Routine trim. All good."),

  rec("Elsie", "Hoof & Dental", "Hoof trim", "2025-11-05", "Routine trim. Good condition."),
  rec("Elsie", "Hoof & Dental", "Hoof trim", "2026-01-08", "Routine trim. Hooves healthy."),
  rec("Elsie", "Hoof & Dental", "Hoof trim", "2026-03-12", "Routine trim. No issues noted."),

  rec("Fred", "Hoof & Dental", "Hoof trim", "2025-11-05", "Routine trim alongside Elsie."),
  rec("Fred", "Hoof & Dental", "Hoof trim", "2026-01-08", "Routine trim. Good hooves."),

  rec("Lila", "Hoof & Dental", "Hoof trim", "2025-11-20", "Routine trim. Fast grower — may need 6-week schedule."),
  rec("Lila", "Hoof & Dental", "Hoof trim", "2026-01-05", "Trim at 6 weeks. Good decision — hooves were getting long."),
  rec("Lila", "Hoof & Dental", "Hoof trim", "2026-02-18", "Routine trim. Settling into 6-week cycle."),

  rec("Petey", "Hoof & Dental", "Hoof trim — gentle", "2025-11-22", "Senior-appropriate trim. Thin soles — farrier conservative. No shoes needed yet."),
  rec("Petey", "Hoof & Dental", "Hoof trim", "2026-01-15", "Gentle trim. Pete a bit stiff today but cooperative."),
  rec("Petey", "Hoof & Dental", "Hoof trim", "2026-03-10", "Routine trim. Hooves holding up well for his age."),

  // ── Vaccinations — Various Animals ──
  rec("Pink", "Vaccination", "Annual vaccinations", "2025-12-01", "West Nile, Tetanus, EEE/WEE, Rabies. No reactions."),
  rec("Eli", "Vaccination", "Annual vaccinations", "2025-12-01", "Full vaccine series. No adverse reactions."),
  rec("Elsie", "Vaccination", "Annual vaccinations", "2025-12-03", "Full vaccine series. Mild injection site swelling — resolved in 24 hrs."),
  rec("Shelley", "Vaccination", "Annual vaccinations", "2025-12-05", "Vaccinated with care around leg area. No issues."),
  rec("Winnie", "Vaccination", "Annual vaccinations", "2025-12-05", "Full series administered. Calm throughout."),
  rec("Petey", "Vaccination", "Annual vaccinations — senior protocol", "2025-12-10", "Senior vaccination protocol — split over two visits. First round today. Tetanus + West Nile."),
  rec("Petey", "Vaccination", "Annual vaccinations — part 2", "2025-12-17", "Second round: EEE/WEE + Rabies. No reactions to either visit. Good for seniors."),

  // ── Deworming — Rotating Schedule ──
  rec("Elsie", "Deworming", "Fall deworming — ivermectin", "2025-10-05", "Oral ivermectin paste. Weight-dosed at 480 lbs. No adverse reaction."),
  rec("Fred", "Deworming", "Fall deworming — ivermectin", "2025-10-05", "Oral ivermectin paste. Dosed at 510 lbs."),
  rec("Pink", "Deworming", "Fall deworming — ivermectin", "2025-10-06", "Oral ivermectin. Dosed at 350 lbs. Pink spit out first attempt — second dose successful."),
  rec("Eli", "Deworming", "Fall deworming — ivermectin", "2025-10-06", "Oral ivermectin. Dosed at 380 lbs. Cooperated well."),
  rec("Shelley", "Deworming", "Fall deworming — ivermectin", "2025-10-07", "Oral ivermectin. Dosed at 420 lbs. Given treat reward after."),
  rec("Gabriel", "Deworming", "Fall deworming — ivermectin", "2025-10-07", "Oral ivermectin. Dosed at 275 lbs (growing). Administered by Amber."),
  rec("Edgar", "Deworming", "Fall deworming — ivermectin", "2025-10-08", "Oral ivermectin. Senior dose at 520 lbs. Monitored for 2 hours post-dose."),

  rec("Elsie", "Deworming", "Spring deworming — fenbendazole", "2026-03-20", "Oral fenbendazole (Panacur). 5-day course started. Day 1 of 5."),
  rec("Fred", "Deworming", "Spring deworming — fenbendazole", "2026-03-20", "5-day Panacur course started."),
  rec("Pink", "Deworming", "Spring deworming — fenbendazole", "2026-03-21", "5-day Panacur course started. Mixed in feed — consumed fully."),
  rec("Eli", "Deworming", "Spring deworming — fenbendazole", "2026-03-21", "5-day Panacur course started."),

  // ── Temperature & Weight Logs ──
  rec("Shelley", "Temperature", "Temp check — routine", "2025-11-01", "99.8F — normal range. Checked due to mild lethargy. Resumed normal activity by afternoon."),
  rec("Gabriel", "Temperature", "Temp check — post-fitting", "2025-11-18", "100.1F — slightly elevated post prosthetic fitting. Within acceptable range. Monitor overnight."),
  rec("Gabriel", "Temperature", "Temp check — follow-up", "2025-11-19", "99.5F — back to normal. No concerns."),
  rec("Edgar", "Temperature", "Temp check — winter wellness", "2026-01-10", "99.7F — normal. Checked as part of winter senior wellness round."),
  rec("Fernie", "Temperature", "Temp check — growth site", "2026-02-25", "100.0F — normal. Checked due to slight warmth around growth bandage area. No systemic concern."),

  rec("Elsie", "Weight", "Quarterly weight — winter", "2025-12-15", "Weight: 485 lbs. Slight increase from fall. Normal winter weight gain. BCS 3.5/5."),
  rec("Pink", "Weight", "Quarterly weight", "2025-12-15", "Weight: 355 lbs. Stable. Good condition."),
  rec("Petey", "Weight", "Senior weight check", "2026-01-12", "Weight: 410 lbs. Stable for senior. Continue monitoring monthly."),
  rec("Lila", "Weight", "Quarterly weight", "2026-01-12", "Weight: 365 lbs. Healthy range for age and build."),

  // ── Upcoming / Overdue Items ──
  rec("Edgar", "Hoof & Dental", "Dental float — due", "2026-04-15", "Annual dental float scheduled. Last float was Nov 2025.", false),
  rec("Winky", "Hoof & Dental", "Hoof trim — overdue", "2026-03-25", "Hoof trim past due. Last trim was Jan 20. Schedule ASAP.", true),
  rec("Swayze", "Medication", "Equioxx refill needed", "2026-04-01", "Equioxx supply running low. Reorder by end of month.", true),
  rec("Petey", "Vet Visit", "Senior wellness — spring", "2026-04-10", "Spring senior wellness exam scheduled with Dr. Moreno."),
  rec("Gabriel", "Vet Visit", "Prosthetic fitting — scheduled", "2026-04-08", "Next prosthetic fitting and growth check. Socket may need replacement again."),
  rec("Cassidy", "Hoof & Dental", "Corrective hoof trim — due", "2026-04-20", "Next corrective trim on 8-week schedule."),
  rec("Rodney", "Vet Visit", "Senior wellness exam — due", "2026-04-12", "Annual senior wellness exam. Monitor for colic history."),
  rec("Churro", "Weight", "Weight check — scheduled", "2026-04-05", "Monthly weight monitoring. Adjust portions if needed."),
  rec("Jasper", "Vet Visit", "Senior wellness + hearing check", "2026-04-15", "Annual exam. Include hearing assessment — use visual cues during exam."),
];

// Backwards-compatible alias
export const medicalRecords = medicalEntries;

// ── Imported entries (parsed from CSVs) ──
import { importedMedicalEntries } from "./deworming-vaccination-data";
import { powerPackEntries } from "./power-pack-data";
import {
  braveActualEntries,
  scheduledDewormingEntries,
} from "./scheduled-and-events-data";
import { annualExamEntries } from "./donkey-profiles-data";

// Sources of deworming truth, in order of authority (highest first):
//   1. brave-events.csv  → braveActualEntries  (per-donkey events with weights)
//   2. power-pack-doses.csv → powerPackEntries (day-by-day power-pack log)
//   3. deworming-vaccination.csv (history strings) → importedMedicalEntries
// When a higher-authority source has a record for (animal, drug) within
// OVERLAP_DAYS, lower-authority records are dropped.

function dayDiff(a: string, b: string): number {
  return Math.abs(
    Math.round(
      (new Date(a + "T00:00:00").getTime() -
        new Date(b + "T00:00:00").getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );
}

function entryDrug(e: MedicalEntry): string | null {
  const t = e.title.toLowerCase();
  if (t.includes("fenbendazole")) return "Fenbendazole";
  if (t.includes("pyrantel")) return "Pyrantel";
  if (t.includes("ivermectin")) return "Ivermectin";
  if (t.includes("moxidectin")) return "Moxidectin";
  if (t.includes("tri-wormer")) return "Tri-wormer";
  return null;
}

const OVERLAP_DAYS = 7; // wider window for power-pack vs power-pack overlap

// Brave events are the authoritative source for Brave herd dosing.
// Drop any power-pack entry for an animal that also has a Brave event for the
// same drug within OVERLAP_DAYS — the Brave events have the correct start dates.
const dedupedPowerPackEntries = powerPackEntries.filter((pp) => {
  return !braveActualEntries.some((b) => {
    if (b.animal !== pp.animal) return false;
    const bDrug = entryDrug(b);
    if (bDrug !== pp.drug) return false;
    return dayDiff(b.date, pp.date) <= OVERLAP_DAYS;
  });
});

// Then drop summary-level entries that overlap with EITHER higher-authority source.
const dedupedDewormingImports = importedMedicalEntries.filter((e) => {
  if (e.type !== "Deworming") return true;
  const drug = entryDrug(e);
  if (!drug) return true;
  const overlapsHighAuth = (other: { animal: string; date: string; drug?: string; title?: string }) => {
    if (other.animal !== e.animal) return false;
    const otherDrug =
      "drug" in other && other.drug
        ? other.drug
        : entryDrug(other as MedicalEntry);
    if (otherDrug !== drug) return false;
    return dayDiff(other.date, e.date) <= OVERLAP_DAYS;
  };
  if (dedupedPowerPackEntries.some(overlapsHighAuth)) return false;
  if (braveActualEntries.some(overlapsHighAuth)) return false;
  return true;
});

// Strip the extra `drug` field from power-pack entries when merging into MedicalEntry[]
const powerPackAsMedical: MedicalEntry[] = dedupedPowerPackEntries.map(
  ({ drug: _drug, ...rest }) => rest
);

export const allMedicalEntries: MedicalEntry[] = [
  ...medicalEntries,
  ...dedupedDewormingImports,
  ...powerPackAsMedical,
  ...braveActualEntries,
  ...scheduledDewormingEntries,
  ...annualExamEntries,
];

// ── Helper Functions ──

export function getEntriesForAnimal(animalName: string): MedicalEntry[] {
  return allMedicalEntries
    .filter((r) => r.animal === animalName)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export const getRecordsForAnimal = getEntriesForAnimal;

export function getAllEntriesSorted(): MedicalEntry[] {
  return [...allMedicalEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export const getAllRecordsSorted = getAllEntriesSorted;

export function getOverdueEntries(today: Date): MedicalEntry[] {
  return medicalEntries
    .filter((r) => {
      const d = new Date(r.date);
      return d < today && r.urgent;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export const getOverdueRecords = getOverdueEntries;

export function getUpcomingEntries(today: Date): MedicalEntry[] {
  return medicalEntries
    .filter((r) => new Date(r.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export const getUpcomingRecords = getUpcomingEntries;

export function getRecentEntries(today: Date, days = 30): MedicalEntry[] {
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - days);
  return medicalEntries
    .filter((r) => {
      const d = new Date(r.date);
      return d >= cutoff && d <= today;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export const getRecentRecords = getRecentEntries;
