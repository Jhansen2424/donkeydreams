"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  X,
  Plus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Repeat,
  ChevronDown,
  RefreshCw,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  donationHistory,
  computeMonthlyTotals,
  computeRecurringDonors,
  getDonationStats,
  sourceMeta,
  allSources,
  type Donation,
  type DonationSource,
  type DonationType,
  type StripeTransaction,
} from "@/lib/donation-data";
import { formatDate as sharedFormatDate } from "@/lib/format-date";

// ── Helpers ──

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

function formatDate(iso: string) {
  return sharedFormatDate(iso);
}

function formatDateFull(iso: string) {
  return sharedFormatDate(iso);
}

// ── Source bar (proportional) ──

function SourceBar({ bySource, total }: { bySource: Record<DonationSource, number>; total: number }) {
  if (total === 0) return null;
  const colors: Record<DonationSource, string> = {
    stripe: "bg-indigo-500",
    zeffy: "bg-emerald-500",
    paypal: "bg-blue-500",
    venmo: "bg-sky-500",
    zelle: "bg-purple-500",
    check: "bg-amber-500",
  };

  return (
    <div className="w-full h-3 rounded-full overflow-hidden flex" title="Breakdown by source">
      {allSources.map((src) => {
        const pct = (bySource[src] / total) * 100;
        if (pct < 0.5) return null;
        return (
          <div
            key={src}
            className={`${colors[src]} transition-all`}
            style={{ width: `${pct}%` }}
            title={`${sourceMeta[src].label}: ${formatCurrency(bySource[src])} (${pct.toFixed(0)}%)`}
          />
        );
      })}
    </div>
  );
}

// ── Page ──

export default function DonationsPage() {
  const [localDonations, setLocalDonations] = useState<Donation[]>([]);
  const allDonations = useMemo(() => [...donationHistory, ...localDonations].sort((a, b) => b.date.localeCompare(a.date)), [localDonations]);

  const stats = useMemo(() => getDonationStats(allDonations), [allDonations]);
  const monthlyTotals = useMemo(() => computeMonthlyTotals(allDonations), [allDonations]);
  const recurringDonors = useMemo(() => computeRecurringDonors(allDonations), [allDonations]);

  // UI state
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState<DonationSource | "all">("all");
  const [filterType, setFilterType] = useState<DonationType | "all">("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"log" | "sources" | "recurring" | "stripe">("log");

  // Add form state
  const [formAmount, setFormAmount] = useState("");
  const [formSource, setFormSource] = useState<DonationSource>("zeffy");
  const [formType, setFormType] = useState<DonationType>("one-time");
  const [formDonor, setFormDonor] = useState("");
  const [formDate, setFormDate] = useState("2026-03-31");
  const [formNotes, setFormNotes] = useState("");

  // Stripe live data
  const [stripeData, setStripeData] = useState<{ transactions: StripeTransaction[]; subscriptionCount: number; monthlyRecurring: number } | null>(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState("");

  function handleAddDonation() {
    const amount = parseFloat(formAmount);
    if (!amount || amount <= 0) return;

    const newDonation: Donation = {
      id: `manual-${Date.now()}`,
      date: formDate,
      amount,
      source: formSource,
      type: formType,
      donorName: formDonor.trim() || "Anonymous",
      notes: formNotes.trim(),
      ...(formType === "recurring" ? { recurring: { interval: "monthly" as const, startDate: formDate } } : {}),
    };

    setLocalDonations((prev) => [...prev, newDonation]);
    setFormAmount("");
    setFormDonor("");
    setFormNotes("");
    setShowAddForm(false);
  }

  async function fetchStripeData() {
    setStripeLoading(true);
    setStripeError("");
    try {
      const res = await fetch("/api/stripe-transactions");
      const data = await res.json();
      if (data.error && data.transactions.length === 0 && data.error.includes("not configured")) {
        setStripeError("STRIPE_SECRET_KEY not configured. Add it to your .env.local file to see live Stripe data.");
      }
      setStripeData(data);
    } catch {
      setStripeError("Failed to connect to Stripe API");
    }
    setStripeLoading(false);
  }

  useEffect(() => {
    if (activeTab === "stripe") fetchStripeData();
  }, [activeTab]);

  // Filtered log
  const filteredLog = useMemo(() => {
    let result = allDonations;
    if (filterSource !== "all") result = result.filter((d) => d.source === filterSource);
    if (filterType !== "all") result = result.filter((d) => d.type === filterType);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.donorName.toLowerCase().includes(q) ||
          d.notes.toLowerCase().includes(q) ||
          sourceMeta[d.source].label.toLowerCase().includes(q) ||
          formatCurrency(d.amount).includes(q)
      );
    }
    return result;
  }, [allDonations, filterSource, filterType, search]);

  // Monthly bar chart max
  const maxMonthly = Math.max(...monthlyTotals.map((m) => m.total), 1);

  const tabs = [
    { id: "log" as const, label: "Donation Log" },
    { id: "sources" as const, label: "By Source" },
    { id: "recurring" as const, label: "Recurring Donors" },
    { id: "stripe" as const, label: "Stripe Live" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Donations</h1>
          <p className="text-sm text-warm-gray mt-1">
            Track contributions across all sources
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-sidebar text-white rounded-lg text-sm font-medium hover:bg-sidebar-light transition-colors"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAddForm ? "Cancel" : "Log Donation"}
        </button>
      </div>

      {/* ══════ ADD FORM ══════ */}
      {showAddForm && (
        <div className="bg-white rounded-xl border border-card-border p-5 space-y-4">
          <h3 className="font-bold text-charcoal">Log a Donation</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-1">
                Amount *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray/50" />
                <input
                  type="number"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-3 py-2 text-sm border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
                  autoFocus
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-1">
                Source
              </label>
              <div className="relative">
                <select
                  value={formSource}
                  onChange={(e) => setFormSource(e.target.value as DonationSource)}
                  className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-sand/50"
                >
                  {allSources.map((s) => (
                    <option key={s} value={s}>
                      {sourceMeta[s].icon} {sourceMeta[s].label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-warm-gray absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-1">
                Type
              </label>
              <div className="relative">
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as DonationType)}
                  className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-sand/50"
                >
                  <option value="one-time">One-time</option>
                  <option value="recurring">Recurring (Monthly)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-warm-gray absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-1">
                Donor
              </label>
              <input
                type="text"
                value={formDonor}
                onChange={(e) => setFormDonor(e.target.value)}
                placeholder="Name or Anonymous"
                className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-warm-gray/60 mb-1">
                Date
              </label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleAddDonation}
                disabled={!formAmount || parseFloat(formAmount) <= 0}
                className="w-full px-4 py-2 bg-sidebar text-white rounded-lg text-sm font-medium hover:bg-sidebar-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
          <input
            type="text"
            value={formNotes}
            onChange={(e) => setFormNotes(e.target.value)}
            placeholder="Notes (optional) — e.g., 'Hay Supper Club', 'For Gabriel's care'"
            className="w-full px-3 py-2 text-sm border border-card-border rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-sand/50"
          />
        </div>
      )}

      {/* ══════ STAT CARDS ══════ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-card-border p-4 col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.thisMonthTotal)}</p>
              <div className="flex items-center gap-1">
                <p className="text-xs text-warm-gray font-medium">This Month</p>
                {stats.pctChange !== 0 && (
                  <span className={`inline-flex items-center text-[10px] font-bold ${stats.pctChange > 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {stats.pctChange > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(stats.pctChange).toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-card-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Repeat className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-indigo-600">{formatCurrency(stats.recurringTotal)}</p>
              <p className="text-xs text-warm-gray font-medium">Recurring</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-card-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
              <Zap className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-sky-600">{formatCurrency(stats.oneTimeTotal)}</p>
              <p className="text-xs text-warm-gray font-medium">One-time</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-card-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{stats.donorCount}</p>
              <p className="text-xs text-warm-gray font-medium">Donors</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-card-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.avgGift)}</p>
              <p className="text-xs text-warm-gray font-medium">Avg Gift</p>
            </div>
          </div>
        </div>
      </div>

      {/* Source breakdown bar */}
      <div className="bg-white rounded-xl border border-card-border p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-warm-gray/60">March by Source</p>
          <div className="flex items-center gap-3 flex-wrap">
            {allSources.map((src) => {
              const amount = stats.bySource[src];
              if (amount === 0) return null;
              return (
                <span key={src} className="inline-flex items-center gap-1.5 text-xs text-warm-gray">
                  <span className={`w-2 h-2 rounded-full ${sourceMeta[src].dot}`} />
                  {sourceMeta[src].label}: {formatCurrency(amount)}
                </span>
              );
            })}
          </div>
        </div>
        <SourceBar bySource={stats.bySource} total={stats.thisMonthTotal} />
      </div>

      {/* ══════ TABS ══════ */}
      <div className="border-b border-card-border overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t.id
                  ? "border-sidebar text-sidebar"
                  : "border-transparent text-warm-gray hover:text-charcoal"
              }`}
            >
              {t.label}
              {t.id === "stripe" && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600">LIVE</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ══════ DONATION LOG TAB ══════ */}
      {activeTab === "log" && (
        <>
          {/* Search + filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-gray/50" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by donor, amount, or notes..."
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-card-border rounded-xl text-sm text-charcoal placeholder:text-warm-gray/50 focus:outline-none focus:ring-2 focus:ring-sand/50 focus:border-sand"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-gray/50 hover:text-charcoal">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="relative shrink-0">
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value as DonationSource | "all")}
                className="appearance-none pl-3 pr-8 py-3.5 text-sm border border-card-border rounded-xl text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-sand/50"
              >
                <option value="all">All Sources</option>
                {allSources.map((s) => (
                  <option key={s} value={s}>{sourceMeta[s].label}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-warm-gray absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <div className="relative shrink-0">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as DonationType | "all")}
                className="appearance-none pl-3 pr-8 py-3.5 text-sm border border-card-border rounded-xl text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-sand/50"
              >
                <option value="all">All Types</option>
                <option value="one-time">One-time</option>
                <option value="recurring">Recurring</option>
              </select>
              <ChevronDown className="w-4 h-4 text-warm-gray absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Log table */}
          {filteredLog.length === 0 ? (
            <div className="bg-white rounded-xl border border-card-border p-12 text-center">
              <DollarSign className="w-10 h-10 text-warm-gray/30 mx-auto mb-3" />
              <p className="text-warm-gray font-medium">No donations found</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-card-border overflow-hidden">
              <div className="hidden lg:grid grid-cols-[100px_1fr_120px_100px_100px_1fr] gap-4 px-5 py-3 border-b border-card-border bg-cream/50 text-xs font-semibold uppercase tracking-wider text-warm-gray/60">
                <span>Date</span>
                <span>Donor</span>
                <span>Amount</span>
                <span>Source</span>
                <span>Type</span>
                <span>Notes</span>
              </div>
              <div className="divide-y divide-card-border max-h-[50vh] overflow-y-auto">
                {filteredLog.map((d) => {
                  const meta = sourceMeta[d.source];
                  return (
                    <div
                      key={d.id}
                      className="grid grid-cols-2 lg:grid-cols-[100px_1fr_120px_100px_100px_1fr] gap-x-4 gap-y-1 px-5 py-3 hover:bg-cream/20 transition-colors items-center"
                    >
                      <span className="text-xs text-warm-gray">{formatDate(d.date)}</span>
                      <span className="text-sm font-medium text-charcoal truncate">
                        {d.donorName || "Anonymous"}
                      </span>
                      <span className="text-sm font-bold text-charcoal tabular-nums">
                        {formatCurrency(d.amount)}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border w-fit ${meta.bg} ${meta.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </span>
                      <span className="hidden lg:block">
                        {d.type === "recurring" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                            <Repeat className="w-3 h-3" />
                            Monthly
                          </span>
                        ) : (
                          <span className="text-xs text-warm-gray">One-time</span>
                        )}
                      </span>
                      <span className="col-span-2 lg:col-span-1 text-xs text-warm-gray truncate">
                        {d.notes}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ══════ BY SOURCE TAB ══════ */}
      {activeTab === "sources" && (
        <div className="space-y-6">
          {/* Source cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allSources.map((src) => {
              const meta = sourceMeta[src];
              const thisMonth = stats.bySource[src];
              const lastMonth = monthlyTotals[1]?.bySource[src] ?? 0;
              const change = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;
              const count = allDonations.filter((d) => d.source === src && d.date.startsWith("2026-03")).length;

              return (
                <div key={src} className={`rounded-xl border p-5 ${meta.bg}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{meta.icon}</span>
                      <span className={`font-bold ${meta.color}`}>{meta.label}</span>
                    </div>
                    {change !== 0 && (
                      <span className={`text-xs font-bold ${change > 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {change > 0 ? "+" : ""}{change.toFixed(0)}%
                      </span>
                    )}
                  </div>
                  <p className="text-3xl font-extrabold text-charcoal">{formatCurrency(thisMonth)}</p>
                  <p className="text-xs text-warm-gray mt-1">
                    {count} donation{count !== 1 ? "s" : ""} this month
                    {lastMonth > 0 && ` · ${formatCurrency(lastMonth)} last month`}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Monthly comparison */}
          <div className="bg-white rounded-xl border border-card-border p-5">
            <h3 className="font-bold text-charcoal mb-4">Monthly Comparison</h3>
            <div className="space-y-3">
              {monthlyTotals.map((m) => (
                <div key={m.month} className="flex items-center gap-4">
                  <span className="text-sm font-medium text-charcoal w-20 shrink-0">{m.label}</span>
                  <div className="flex-1">
                    <div className="w-full bg-cream rounded-full h-6 overflow-hidden flex items-center">
                      <div
                        className="h-full bg-sidebar/80 rounded-full transition-all flex items-center justify-end pr-2"
                        style={{ width: `${Math.max((m.total / maxMonthly) * 100, 8)}%` }}
                      >
                        <span className="text-[11px] font-bold text-white whitespace-nowrap">
                          {formatCurrency(m.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Source breakdown per month */}
          <div className="bg-white rounded-xl border border-card-border p-5">
            <h3 className="font-bold text-charcoal mb-4">Source Breakdown by Month</h3>
            <div className="space-y-4">
              {monthlyTotals.map((m) => (
                <div key={m.month}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-charcoal">{m.label}</span>
                    <span className="text-sm font-bold text-charcoal">{formatCurrency(m.total)}</span>
                  </div>
                  <SourceBar bySource={m.bySource} total={m.total} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════ RECURRING DONORS TAB ══════ */}
      {activeTab === "recurring" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-indigo-200 bg-indigo-50/30 p-5">
            <div className="flex items-center gap-3 mb-1">
              <Repeat className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-charcoal">Monthly Recurring Revenue</h3>
            </div>
            <p className="text-3xl font-extrabold text-indigo-600">
              {formatCurrency(recurringDonors.reduce((s, d) => s + d.amount, 0))}
              <span className="text-sm font-medium text-warm-gray ml-2">/month</span>
            </p>
            <p className="text-xs text-warm-gray mt-1">
              {recurringDonors.length} active recurring donor{recurringDonors.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-card-border overflow-hidden">
            <div className="hidden lg:grid grid-cols-[1fr_100px_100px_120px_120px] gap-4 px-5 py-3 border-b border-card-border bg-cream/50 text-xs font-semibold uppercase tracking-wider text-warm-gray/60">
              <span>Donor</span>
              <span>Amount</span>
              <span>Source</span>
              <span>Since</span>
              <span>Last Payment</span>
            </div>
            <div className="divide-y divide-card-border">
              {recurringDonors.map((d) => {
                const meta = sourceMeta[d.source];
                return (
                  <div
                    key={d.donorName}
                    className="grid grid-cols-2 lg:grid-cols-[1fr_100px_100px_120px_120px] gap-x-4 gap-y-1 px-5 py-3 items-center"
                  >
                    <span className="text-sm font-medium text-charcoal">{d.donorName}</span>
                    <span className="text-sm font-bold text-charcoal tabular-nums">
                      {formatCurrency(d.amount)}/mo
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border w-fit ${meta.bg} ${meta.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                      {meta.label}
                    </span>
                    <span className="text-xs text-warm-gray hidden lg:block">{formatDateFull(d.startDate)}</span>
                    <span className="text-xs text-warm-gray hidden lg:block">{formatDateFull(d.lastPayment)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════ STRIPE LIVE TAB ══════ */}
      {activeTab === "stripe" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-indigo-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">💳</span>
                <h3 className="font-bold text-charcoal">Stripe Live Data</h3>
              </div>
              <button
                onClick={fetchStripeData}
                disabled={stripeLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${stripeLoading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>

            {stripeError ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800 font-medium">Stripe Not Connected</p>
                <p className="text-xs text-amber-600 mt-1">{stripeError}</p>
                <div className="mt-3 bg-white rounded-lg border border-amber-200 p-3">
                  <p className="text-xs font-mono text-charcoal">
                    # Add to .env.local:<br />
                    STRIPE_SECRET_KEY=sk_live_...
                  </p>
                </div>
              </div>
            ) : stripeLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
              </div>
            ) : stripeData ? (
              <div className="space-y-4">
                {/* Stripe stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-indigo-50 rounded-lg p-4">
                    <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">Active Subscriptions</p>
                    <p className="text-2xl font-bold text-indigo-700">{stripeData.subscriptionCount}</p>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-4">
                    <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">Monthly Recurring</p>
                    <p className="text-2xl font-bold text-indigo-700">{formatCurrency(stripeData.monthlyRecurring)}</p>
                  </div>
                </div>

                {/* Stripe transactions */}
                {stripeData.transactions.length > 0 ? (
                  <div className="divide-y divide-card-border rounded-lg border border-card-border overflow-hidden">
                    {stripeData.transactions.map((t) => (
                      <div key={t.id} className="flex items-center gap-4 px-4 py-3 bg-white">
                        <span className="text-xs text-warm-gray w-20 shrink-0">{formatDate(t.date)}</span>
                        <span className="text-sm text-charcoal truncate flex-1">{t.donorEmail || "—"}</span>
                        <span className="text-sm font-bold text-charcoal tabular-nums">{formatCurrency(t.amount)}</span>
                        {t.recurring && (
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                            RECURRING
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-warm-gray text-center py-6">No transactions found</p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
