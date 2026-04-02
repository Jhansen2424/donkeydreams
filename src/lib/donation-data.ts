// ── Types ──

export type DonationSource = "stripe" | "zeffy" | "paypal" | "venmo" | "zelle" | "check";
export type DonationType = "one-time" | "recurring";

export interface Donation {
  id: string;
  date: string; // ISO date
  amount: number;
  source: DonationSource;
  type: DonationType;
  donorName: string; // "" for anonymous
  notes: string;
  recurring?: { interval: "monthly"; startDate: string };
  stripeId?: string; // Stripe charge/payment ID, if from Stripe
}

export interface MonthlyTotal {
  month: string; // "2026-03", "2026-02", etc.
  label: string; // "Mar 2026"
  total: number;
  bySource: Record<DonationSource, number>;
}

export interface RecurringDonor {
  donorName: string;
  amount: number;
  source: DonationSource;
  startDate: string;
  lastPayment: string;
  active: boolean;
}

// ── Source metadata ──

export const sourceMeta: Record<DonationSource, { label: string; color: string; bg: string; dot: string; icon: string }> = {
  stripe:  { label: "Stripe",  color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200", dot: "bg-indigo-500", icon: "💳" },
  zeffy:   { label: "Zeffy",   color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500", icon: "💚" },
  paypal:  { label: "PayPal",  color: "text-blue-700", bg: "bg-blue-50 border-blue-200", dot: "bg-blue-500", icon: "🅿️" },
  venmo:   { label: "Venmo",   color: "text-sky-700", bg: "bg-sky-50 border-sky-200", dot: "bg-sky-500", icon: "📱" },
  zelle:   { label: "Zelle",   color: "text-purple-700", bg: "bg-purple-50 border-purple-200", dot: "bg-purple-500", icon: "🏦" },
  check:   { label: "Check/Mail", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", dot: "bg-amber-500", icon: "✉️" },
};

export const allSources: DonationSource[] = ["stripe", "zeffy", "paypal", "venmo", "zelle", "check"];

// ── Dummy donation history ──
// 3 months of realistic data across all sources

const dummyDonations: Donation[] = [
  // ── March 2026 ──
  { id: "d-1",  date: "2026-03-01", amount: 90,  source: "stripe",  type: "recurring", donorName: "Linda & Tom K.", notes: "Gold sponsor — Shelley", recurring: { interval: "monthly", startDate: "2025-06-15" } },
  { id: "d-2",  date: "2026-03-01", amount: 125, source: "stripe",  type: "recurring", donorName: "The Martinez Family", notes: "Platinum sponsor — Shelley", recurring: { interval: "monthly", startDate: "2025-09-01" } },
  { id: "d-3",  date: "2026-03-01", amount: 60,  source: "stripe",  type: "recurring", donorName: "David R.", notes: "Silver sponsor — Rusty", recurring: { interval: "monthly", startDate: "2025-11-20" } },
  { id: "d-4",  date: "2026-03-01", amount: 90,  source: "stripe",  type: "recurring", donorName: "Sarah & Mike P.", notes: "Gold sponsor — Captain", recurring: { interval: "monthly", startDate: "2025-08-10" } },
  { id: "d-5",  date: "2026-03-03", amount: 250, source: "zeffy",   type: "one-time",  donorName: "Mark & Julie S.", notes: "Hay Supper Club donation" },
  { id: "d-6",  date: "2026-03-05", amount: 50,  source: "venmo",   type: "one-time",  donorName: "Chris A.", notes: "" },
  { id: "d-7",  date: "2026-03-07", amount: 100, source: "paypal",  type: "one-time",  donorName: "Anonymous", notes: "" },
  { id: "d-8",  date: "2026-03-08", amount: 75,  source: "zelle",   type: "one-time",  donorName: "Pam D.", notes: "For Gabriel's care" },
  { id: "d-9",  date: "2026-03-10", amount: 500, source: "check",   type: "one-time",  donorName: "Rotary Club of Mesquite", notes: "Annual gift" },
  { id: "d-10", date: "2026-03-12", amount: 35,  source: "venmo",   type: "one-time",  donorName: "Jess T.", notes: "" },
  { id: "d-11", date: "2026-03-14", amount: 200, source: "zeffy",   type: "one-time",  donorName: "Karen & Bob W.", notes: "Birthday fundraiser" },
  { id: "d-12", date: "2026-03-15", amount: 125, source: "stripe",  type: "recurring", donorName: "James & Ann H.", notes: "Platinum sponsor — Rosie", recurring: { interval: "monthly", startDate: "2025-07-01" } },
  { id: "d-13", date: "2026-03-17", amount: 50,  source: "paypal",  type: "one-time",  donorName: "Tyler M.", notes: "" },
  { id: "d-14", date: "2026-03-18", amount: 30,  source: "venmo",   type: "one-time",  donorName: "Lisa N.", notes: "Saw the TikTok!" },
  { id: "d-15", date: "2026-03-20", amount: 90,  source: "stripe",  type: "recurring", donorName: "Jennifer W.", notes: "Gold sponsor — Samson", recurring: { interval: "monthly", startDate: "2026-01-05" } },
  { id: "d-16", date: "2026-03-20", amount: 125, source: "stripe",  type: "recurring", donorName: "The Nguyen Family", notes: "Platinum sponsor — Cookie", recurring: { interval: "monthly", startDate: "2025-05-20" } },
  { id: "d-17", date: "2026-03-22", amount: 150, source: "zeffy",   type: "one-time",  donorName: "Anonymous", notes: "" },
  { id: "d-18", date: "2026-03-24", amount: 40,  source: "zelle",   type: "one-time",  donorName: "Maria G.", notes: "" },
  { id: "d-19", date: "2026-03-25", amount: 60,  source: "stripe",  type: "recurring", donorName: "Carol B.", notes: "Silver sponsor — Cinnamon", recurring: { interval: "monthly", startDate: "2025-12-01" } },
  { id: "d-20", date: "2026-03-27", amount: 1000, source: "check",  type: "one-time",  donorName: "Desert Heritage Foundation", notes: "Grant — Q1 operating" },
  { id: "d-21", date: "2026-03-28", amount: 90,  source: "stripe",  type: "recurring", donorName: "Bob & Janet L.", notes: "Gold sponsor — Dusty", recurring: { interval: "monthly", startDate: "2025-10-01" } },
  { id: "d-22", date: "2026-03-29", amount: 25,  source: "venmo",   type: "one-time",  donorName: "Sam K.", notes: "" },
  { id: "d-23", date: "2026-03-30", amount: 75,  source: "paypal",  type: "one-time",  donorName: "Angela R.", notes: "Virtual visit tip" },
  { id: "d-24", date: "2026-03-31", amount: 60,  source: "stripe",  type: "recurring", donorName: "Patricia D.", notes: "Silver sponsor — Captain", recurring: { interval: "monthly", startDate: "2026-01-15" } },

  // ── February 2026 ──
  { id: "d-30", date: "2026-02-01", amount: 90,  source: "stripe",  type: "recurring", donorName: "Linda & Tom K.", notes: "Gold sponsor" },
  { id: "d-31", date: "2026-02-01", amount: 125, source: "stripe",  type: "recurring", donorName: "The Martinez Family", notes: "Platinum sponsor" },
  { id: "d-32", date: "2026-02-01", amount: 60,  source: "stripe",  type: "recurring", donorName: "David R.", notes: "Silver sponsor" },
  { id: "d-33", date: "2026-02-01", amount: 90,  source: "stripe",  type: "recurring", donorName: "Sarah & Mike P.", notes: "Gold sponsor" },
  { id: "d-34", date: "2026-02-03", amount: 100, source: "zeffy",   type: "one-time",  donorName: "Valentines Fundraiser", notes: "" },
  { id: "d-35", date: "2026-02-07", amount: 50,  source: "paypal",  type: "one-time",  donorName: "Anonymous", notes: "" },
  { id: "d-36", date: "2026-02-10", amount: 35,  source: "venmo",   type: "one-time",  donorName: "Jess T.", notes: "" },
  { id: "d-37", date: "2026-02-14", amount: 200, source: "zeffy",   type: "one-time",  donorName: "Be My Donkey Valentine event", notes: "Event proceeds" },
  { id: "d-38", date: "2026-02-15", amount: 125, source: "stripe",  type: "recurring", donorName: "James & Ann H.", notes: "Platinum sponsor" },
  { id: "d-39", date: "2026-02-18", amount: 75,  source: "zelle",   type: "one-time",  donorName: "Pam D.", notes: "" },
  { id: "d-40", date: "2026-02-20", amount: 90,  source: "stripe",  type: "recurring", donorName: "Jennifer W.", notes: "Gold sponsor" },
  { id: "d-41", date: "2026-02-20", amount: 125, source: "stripe",  type: "recurring", donorName: "The Nguyen Family", notes: "Platinum sponsor" },
  { id: "d-42", date: "2026-02-22", amount: 150, source: "check",   type: "one-time",  donorName: "Susan P.", notes: "" },
  { id: "d-43", date: "2026-02-25", amount: 60,  source: "stripe",  type: "recurring", donorName: "Carol B.", notes: "Silver sponsor" },
  { id: "d-44", date: "2026-02-28", amount: 90,  source: "stripe",  type: "recurring", donorName: "Bob & Janet L.", notes: "Gold sponsor" },
  { id: "d-45", date: "2026-02-28", amount: 60,  source: "stripe",  type: "recurring", donorName: "Patricia D.", notes: "Silver sponsor" },

  // ── January 2026 ──
  { id: "d-50", date: "2026-01-01", amount: 90,  source: "stripe",  type: "recurring", donorName: "Linda & Tom K.", notes: "" },
  { id: "d-51", date: "2026-01-01", amount: 125, source: "stripe",  type: "recurring", donorName: "The Martinez Family", notes: "" },
  { id: "d-52", date: "2026-01-01", amount: 60,  source: "stripe",  type: "recurring", donorName: "David R.", notes: "" },
  { id: "d-53", date: "2026-01-01", amount: 90,  source: "stripe",  type: "recurring", donorName: "Sarah & Mike P.", notes: "" },
  { id: "d-54", date: "2026-01-05", amount: 500, source: "zeffy",   type: "one-time",  donorName: "New Year Giving Tuesday", notes: "Campaign proceeds" },
  { id: "d-55", date: "2026-01-08", amount: 100, source: "paypal",  type: "one-time",  donorName: "Anonymous", notes: "" },
  { id: "d-56", date: "2026-01-10", amount: 50,  source: "venmo",   type: "one-time",  donorName: "Chris A.", notes: "" },
  { id: "d-57", date: "2026-01-15", amount: 125, source: "stripe",  type: "recurring", donorName: "James & Ann H.", notes: "" },
  { id: "d-58", date: "2026-01-15", amount: 60,  source: "stripe",  type: "recurring", donorName: "Patricia D.", notes: "" },
  { id: "d-59", date: "2026-01-18", amount: 250, source: "check",   type: "one-time",  donorName: "Rotary Club of Mesquite", notes: "" },
  { id: "d-60", date: "2026-01-20", amount: 90,  source: "stripe",  type: "recurring", donorName: "Jennifer W.", notes: "" },
  { id: "d-61", date: "2026-01-20", amount: 125, source: "stripe",  type: "recurring", donorName: "The Nguyen Family", notes: "" },
  { id: "d-62", date: "2026-01-22", amount: 75,  source: "zelle",   type: "one-time",  donorName: "Maria G.", notes: "" },
  { id: "d-63", date: "2026-01-25", amount: 60,  source: "stripe",  type: "recurring", donorName: "Carol B.", notes: "" },
  { id: "d-64", date: "2026-01-28", amount: 90,  source: "stripe",  type: "recurring", donorName: "Bob & Janet L.", notes: "" },
];

export const donationHistory: Donation[] = dummyDonations.sort(
  (a, b) => b.date.localeCompare(a.date)
);

// ── Stats engine ──

export function computeMonthlyTotals(donations: Donation[]): MonthlyTotal[] {
  const map = new Map<string, MonthlyTotal>();

  for (const d of donations) {
    const month = d.date.slice(0, 7); // "2026-03"
    if (!map.has(month)) {
      const date = new Date(d.date + "T00:00:00");
      map.set(month, {
        month,
        label: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        total: 0,
        bySource: { stripe: 0, zeffy: 0, paypal: 0, venmo: 0, zelle: 0, check: 0 },
      });
    }
    const entry = map.get(month)!;
    entry.total += d.amount;
    entry.bySource[d.source] += d.amount;
  }

  return Array.from(map.values()).sort((a, b) => b.month.localeCompare(a.month));
}

export function computeRecurringDonors(donations: Donation[]): RecurringDonor[] {
  const donors = new Map<string, RecurringDonor>();

  for (const d of donations) {
    if (d.type !== "recurring" || !d.donorName) continue;
    const key = d.donorName;
    const existing = donors.get(key);
    if (!existing || d.date > existing.lastPayment) {
      donors.set(key, {
        donorName: d.donorName,
        amount: d.amount,
        source: d.source,
        startDate: d.recurring?.startDate || d.date,
        lastPayment: d.date,
        active: true,
      });
    }
  }

  return Array.from(donors.values()).sort((a, b) => b.amount - a.amount);
}

export function getDonationStats(donations: Donation[]) {
  const now = "2026-03";
  const thisMonth = donations.filter((d) => d.date.startsWith(now));
  const lastMonth = donations.filter((d) => d.date.startsWith("2026-02"));

  const thisTotal = thisMonth.reduce((s, d) => s + d.amount, 0);
  const lastTotal = lastMonth.reduce((s, d) => s + d.amount, 0);
  const pctChange = lastTotal > 0 ? ((thisTotal - lastTotal) / lastTotal) * 100 : 0;

  const recurringThisMonth = thisMonth.filter((d) => d.type === "recurring").reduce((s, d) => s + d.amount, 0);
  const oneTimeThisMonth = thisMonth.filter((d) => d.type === "one-time").reduce((s, d) => s + d.amount, 0);

  const uniqueDonors = new Set(thisMonth.map((d) => d.donorName || "Anonymous")).size;
  const avgGift = thisMonth.length > 0 ? Math.round(thisTotal / thisMonth.length) : 0;

  const bySource: Record<DonationSource, number> = { stripe: 0, zeffy: 0, paypal: 0, venmo: 0, zelle: 0, check: 0 };
  for (const d of thisMonth) bySource[d.source] += d.amount;

  return {
    thisMonthTotal: thisTotal,
    lastMonthTotal: lastTotal,
    pctChange,
    recurringTotal: recurringThisMonth,
    oneTimeTotal: oneTimeThisMonth,
    donorCount: uniqueDonors,
    giftCount: thisMonth.length,
    avgGift,
    bySource,
  };
}

// ── Stripe live data types ──
// These are used when STRIPE_SECRET_KEY is configured

export interface StripeTransaction {
  id: string;
  amount: number;
  date: string;
  status: "succeeded" | "pending" | "failed";
  donorEmail: string;
  description: string;
  recurring: boolean;
}
