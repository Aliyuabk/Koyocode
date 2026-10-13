"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  PageHeader,
  Btn,
  Field,
  inputCls,
  Badge,
  SearchBar,
  EmptyState,
  toast,
} from "./ui";

type Settings = {
  payments_enabled: boolean;
  paystack_public_key: string | null;
  currency: string;
  certificate_enabled: boolean;
  certificate_default_price_kobo: number;
  certificate_require_payment: boolean;
  certificate_auto_issue_on_pass: boolean;
  premium_courses_enabled: boolean;
  premium_default_preview_lessons: number;
  ads_enabled: boolean;
  ads_provider: string | null;
  ads_client_id: string | null;
  ads_slots: Record<string, boolean>;
  ads_skip_for_admins: boolean;
  ads_skip_on_exam: boolean;
  ads_skip_on_checkout: boolean;
};

type Payment = {
  id: string;
  reference: string;
  amount_kobo: number;
  status: string;
  type: string;
  created_at: string;
  paid_at: string | null;
  user_name: string | null;
};

function koboToNaira(kobo: number) {
  return (kobo / 100).toFixed(2);
}

export default function RevenueManager({
  settings,
  payments,
  stats,
}: {
  settings: Settings;
  payments: Payment[];
  stats: {
    totalRevenue: number;
    revenue30: number;
    certCount: number;
    courseCount: number;
    totalPayments: number;
  };
}) {
  const supabase = createClient();
  const router = useRouter();

  const [tab, setTab] = useState<
    "overview" | "payments" | "certificates" | "courses" | "ads" | "keys"
  >("overview");

  const [form, setForm] = useState<Settings>(settings);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState(false);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "certificate" | "course"
  >("all");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "success" | "pending" | "failed"
  >("all");

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    // Clear any previous save state on edit
    setSaveError(null);
    setSaveOk(false);
  }

  async function save() {
    setSaving(true);
    setSaveError(null);
    setSaveOk(false);

    // Prepare payload — only the fields the admin can edit
    const payload = {
      payments_enabled: form.payments_enabled,
      paystack_public_key: form.paystack_public_key?.trim() || null,
      currency: form.currency,
      certificate_enabled: form.certificate_enabled,
      certificate_default_price_kobo: form.certificate_default_price_kobo,
      certificate_require_payment: form.certificate_require_payment,
      certificate_auto_issue_on_pass: form.certificate_auto_issue_on_pass,
      premium_courses_enabled: form.premium_courses_enabled,
      premium_default_preview_lessons: form.premium_default_preview_lessons,
      ads_enabled: form.ads_enabled,
      ads_provider: form.ads_provider,
      ads_client_id: form.ads_client_id?.trim() || null,
      ads_slots: form.ads_slots,
      ads_skip_for_admins: form.ads_skip_for_admins,
      ads_skip_on_exam: form.ads_skip_on_exam,
      ads_skip_on_checkout: form.ads_skip_on_checkout,
    };

    const { data, error } = await supabase
      .from("platform_settings")
      .update(payload)
      .eq("id", 1)
      .select("id")
      .maybeSingle();

    setSaving(false);

    if (error) {
      console.error("Save error:", error);
      setSaveError(error.message);
      toast(error.message, "err");
      return;
    }

    if (!data) {
      // No error but no row returned — RLS blocked it silently
      const msg =
        "Save failed — RLS blocked the update. Check your admin role, or run the SQL fix on platform_settings.";
      setSaveError(msg);
      toast(msg, "err");
      return;
    }

    setSaveOk(true);
    toast("Settings saved");
    router.refresh();
  }

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      (p.user_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      p.reference.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "all" || p.type === filterType;
    const matchesStatus = filterStatus === "all" || p.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div>
      <PageHeader
        title="Revenue"
        subtitle="Payments, certificates, courses, ads, and platform keys"
        action={
          <Btn onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save settings"}
          </Btn>
        }
      />

      {/* SAVE STATUS */}
      {saveError && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
          ⚠ {saveError}
        </div>
      )}
      {saveOk && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          ✓ Settings saved successfully
        </div>
      )}

      {/* TABS */}
      <div className="mt-6 flex flex-wrap gap-1 border-b border-slate-200 dark:border-[#1f2a44]">
        {(
          [
            ["overview", "Overview"],
            ["payments", "Payments"],
            ["certificates", "Certificates"],
            ["courses", "Premium courses"],
            ["ads", "Ads"],
            ["keys", "API keys"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`relative px-4 py-2.5 text-sm font-bold transition ${
              tab === key
                ? "text-purple-700 dark:text-purple-400"
                : "text-slate-500 hover:text-slate-900 dark:text-[#94a3b8] dark:hover:text-[#f1f5f9]"
            }`}
          >
            {label}
            {tab === key && (
              <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-purple-700 dark:bg-purple-500" />
            )}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {/* ============ OVERVIEW ============ */}
        {tab === "overview" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Total revenue",
                value: `₦${koboToNaira(stats.totalRevenue)}`,
                icon: "💰",
                tone: "emerald",
              },
              {
                label: "Last 30 days",
                value: `₦${koboToNaira(stats.revenue30)}`,
                icon: "📈",
                tone: "blue",
              },
              {
                label: "Certificates sold",
                value: stats.certCount,
                icon: "🏆",
                tone: "purple",
              },
              {
                label: "Courses sold",
                value: stats.courseCount,
                icon: "📚",
                tone: "amber",
              },
            ].map((s) => {
              const tones = {
                emerald:
                  "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
                blue: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
                purple:
                  "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300",
                amber:
                  "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
              }[s.tone];
              return (
                <div
                  key={s.label}
                  className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-[#1f2a44] dark:bg-[#131c33]"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#94a3b8]">
                        {s.label}
                      </p>
                      <p className="mt-2 text-2xl font-black text-slate-900 dark:text-[#f1f5f9]">
                        {s.value}
                      </p>
                    </div>
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${tones}`}
                    >
                      {s.icon}
                    </span>
                  </div>
                </div>
              );
            })}

            <div className="mt-4 sm:col-span-2 lg:col-span-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-[#1f2a44] dark:bg-[#131c33]">
                <p className="text-xs font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                  Master switches
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-[#1f2a44] dark:bg-[#0e1526]">
                    <input
                      type="checkbox"
                      checked={form.payments_enabled}
                      onChange={(e) =>
                        update("payments_enabled", e.target.checked)
                      }
                      className="h-4 w-4 rounded border-slate-300 text-purple-700"
                    />
                    <div>
                      <p className="text-sm font-bold dark:text-[#f1f5f9]">
                        Payments
                      </p>
                      <p className="text-xs text-slate-500 dark:text-[#94a3b8]">
                        Global on/off
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-[#1f2a44] dark:bg-[#0e1526]">
                    <input
                      type="checkbox"
                      checked={form.certificate_enabled}
                      onChange={(e) =>
                        update("certificate_enabled", e.target.checked)
                      }
                      className="h-4 w-4 rounded border-slate-300 text-purple-700"
                    />
                    <div>
                      <p className="text-sm font-bold dark:text-[#f1f5f9]">
                        Certificates
                      </p>
                      <p className="text-xs text-slate-500 dark:text-[#94a3b8]">
                        Enable paid certs
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-[#1f2a44] dark:bg-[#0e1526]">
                    <input
                      type="checkbox"
                      checked={form.premium_courses_enabled}
                      onChange={(e) =>
                        update("premium_courses_enabled", e.target.checked)
                      }
                      className="h-4 w-4 rounded border-slate-300 text-purple-700"
                    />
                    <div>
                      <p className="text-sm font-bold dark:text-[#f1f5f9]">
                        Premium courses
                      </p>
                      <p className="text-xs text-slate-500 dark:text-[#94a3b8]">
                        Enable paid courses
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============ PAYMENTS ============ */}
        {tab === "payments" && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-[220px] flex-1">
                <SearchBar
                  value={search}
                  onChange={setSearch}
                  placeholder="Search by user or reference..."
                />
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className={inputCls + " !w-auto"}
              >
                <option value="all">All types</option>
                <option value="certificate">Certificates</option>
                <option value="course">Courses</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className={inputCls + " !w-auto"}
              >
                <option value="all">All statuses</option>
                <option value="success">Success</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {filteredPayments.length === 0 ? (
              <div className="mt-6">
                <EmptyState
                  icon="💳"
                  title="No payments yet"
                  description="Payments will appear here once users start buying."
                />
              </div>
            ) : (
              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-[#1f2a44] dark:bg-[#131c33]">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left dark:bg-[#0e1526]">
                      <tr className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-[#94a3b8]">
                        <th className="px-5 py-3">User</th>
                        <th className="px-5 py-3">Type</th>
                        <th className="px-5 py-3">Amount</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3">Reference</th>
                        <th className="px-5 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#1f2a44]">
                      {filteredPayments.map((p) => (
                        <tr
                          key={p.id}
                          className="hover:bg-slate-50 dark:hover:bg-[#1b2742]"
                        >
                          <td className="px-5 py-3 font-bold dark:text-[#f1f5f9]">
                            {p.user_name ?? "Unnamed"}
                          </td>
                          <td className="px-5 py-3">
                            <Badge
                              tone={
                                p.type === "certificate" ? "purple" : "blue"
                              }
                            >
                              {p.type}
                            </Badge>
                          </td>
                          <td className="px-5 py-3 font-bold dark:text-[#cbd5e1]">
                            ₦{koboToNaira(p.amount_kobo)}
                          </td>
                          <td className="px-5 py-3">
                            <Badge
                              tone={
                                p.status === "success"
                                  ? "emerald"
                                  : p.status === "pending"
                                  ? "amber"
                                  : "red"
                              }
                            >
                              {p.status}
                            </Badge>
                          </td>
                          <td className="px-5 py-3 font-mono text-xs text-slate-500 dark:text-[#94a3b8]">
                            {p.reference.slice(0, 20)}…
                          </td>
                          <td className="px-5 py-3 text-slate-500 dark:text-[#94a3b8]">
                            {new Date(p.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* ============ CERTIFICATES ============ */}
        {tab === "certificates" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-[#1f2a44] dark:bg-[#131c33]">
            <p className="text-xs font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-400">
              Certificate settings
            </p>

            <div className="mt-5 space-y-5">
              <Field
                label="Default certificate price (₦)"
                hint="Applies to any course without a specific price"
              >
                <input
                  type="number"
                  className={inputCls}
                  value={form.certificate_default_price_kobo / 100}
                  onChange={(e) =>
                    update(
                      "certificate_default_price_kobo",
                      Math.max(0, Math.round(Number(e.target.value) * 100))
                    )
                  }
                />
              </Field>

              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-[#1f2a44] dark:bg-[#0e1526]">
                <input
                  type="checkbox"
                  checked={form.certificate_require_payment}
                  onChange={(e) =>
                    update("certificate_require_payment", e.target.checked)
                  }
                  className="h-4 w-4 rounded border-slate-300 text-purple-700"
                />
                <div>
                  <p className="text-sm font-bold dark:text-[#f1f5f9]">
                    Require payment
                  </p>
                  <p className="text-xs text-slate-500 dark:text-[#94a3b8]">
                    Unchecked = every certificate is free
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-[#1f2a44] dark:bg-[#0e1526]">
                <input
                  type="checkbox"
                  checked={form.certificate_auto_issue_on_pass}
                  onChange={(e) =>
                    update(
                      "certificate_auto_issue_on_pass",
                      e.target.checked
                    )
                  }
                  className="h-4 w-4 rounded border-slate-300 text-purple-700"
                />
                <div>
                  <p className="text-sm font-bold dark:text-[#f1f5f9]">
                    Auto-issue on exam pass
                  </p>
                  <p className="text-xs text-slate-500 dark:text-[#94a3b8]">
                    If enabled, certificate is granted the moment exam is
                    passed
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* ============ PREMIUM COURSES ============ */}
        {tab === "courses" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-[#1f2a44] dark:bg-[#131c33]">
            <p className="text-xs font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-400">
              Premium course defaults
            </p>

            <div className="mt-5 space-y-5">
              <Field
                label="Default preview lessons"
                hint="How many lessons are free before the paywall"
              >
                <input
                  type="number"
                  className={inputCls}
                  value={form.premium_default_preview_lessons}
                  onChange={(e) =>
                    update(
                      "premium_default_preview_lessons",
                      Math.max(0, Number(e.target.value))
                    )
                  }
                />
              </Field>

              <p className="text-sm text-slate-600 dark:text-[#94a3b8]">
                To set a course as premium, open{" "}
                <strong>Admin → Courses</strong>, click a course, and toggle{" "}
                <strong>Premium</strong> with its price.
              </p>
            </div>
          </div>
        )}

        {/* ============ ADS ============ */}
        {tab === "ads" && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-[#1f2a44] dark:bg-[#131c33]">
              <p className="text-xs font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                Ad network
              </p>

              <div className="mt-5 space-y-4">
                <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-[#1f2a44] dark:bg-[#0e1526]">
                  <input
                    type="checkbox"
                    checked={form.ads_enabled}
                    onChange={(e) => update("ads_enabled", e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-purple-700"
                  />
                  <div>
                    <p className="text-sm font-bold dark:text-[#f1f5f9]">
                      Enable ads
                    </p>
                    <p className="text-xs text-slate-500 dark:text-[#94a3b8]">
                      Master switch for all placements
                    </p>
                  </div>
                </label>

                <Field label="Provider">
                  <select
                    className={inputCls}
                    value={form.ads_provider ?? "adsense"}
                    onChange={(e) => update("ads_provider", e.target.value)}
                  >
                    <option value="adsense">Google AdSense</option>
                    <option value="adsterra">Adsterra</option>
                    <option value="custom">Custom</option>
                  </select>
                </Field>

                <Field
                  label="Client ID / Publisher ID"
                  hint="From your ad network dashboard"
                >
                  <input
                    className={inputCls}
                    value={form.ads_client_id ?? ""}
                    onChange={(e) => update("ads_client_id", e.target.value)}
                    placeholder="ca-pub-xxxxxxxxxxxxxxxx"
                  />
                </Field>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-[#1f2a44] dark:bg-[#131c33]">
              <p className="text-xs font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                Placements
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {Object.keys(form.ads_slots ?? {}).map((slot) => (
                  <label
                    key={slot}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-[#1f2a44] dark:bg-[#0e1526]"
                  >
                    <input
                      type="checkbox"
                      checked={!!form.ads_slots?.[slot]}
                      onChange={(e) =>
                        update("ads_slots", {
                          ...form.ads_slots,
                          [slot]: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-slate-300 text-purple-700"
                    />
                    <span className="text-sm font-bold capitalize dark:text-[#f1f5f9]">
                      {slot.replace(/_/g, " ")}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-[#1f2a44] dark:bg-[#131c33]">
              <p className="text-xs font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                Safety rules
              </p>

              <div className="mt-5 space-y-3">
                <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-[#1f2a44] dark:bg-[#0e1526]">
                  <input
                    type="checkbox"
                    checked={form.ads_skip_for_admins}
                    onChange={(e) =>
                      update("ads_skip_for_admins", e.target.checked)
                    }
                    className="h-4 w-4 rounded border-slate-300 text-purple-700"
                  />
                  <span className="text-sm font-bold dark:text-[#f1f5f9]">
                    Skip ads for admins
                  </span>
                </label>
                <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-[#1f2a44] dark:bg-[#0e1526]">
                  <input
                    type="checkbox"
                    checked={form.ads_skip_on_exam}
                    onChange={(e) =>
                      update("ads_skip_on_exam", e.target.checked)
                    }
                    className="h-4 w-4 rounded border-slate-300 text-purple-700"
                  />
                  <span className="text-sm font-bold dark:text-[#f1f5f9]">
                    Never show ads on exam pages
                  </span>
                </label>
                <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-[#1f2a44] dark:bg-[#0e1526]">
                  <input
                    type="checkbox"
                    checked={form.ads_skip_on_checkout}
                    onChange={(e) =>
                      update("ads_skip_on_checkout", e.target.checked)
                    }
                    className="h-4 w-4 rounded border-slate-300 text-purple-700"
                  />
                  <span className="text-sm font-bold dark:text-[#f1f5f9]">
                    Never show ads on checkout pages
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ============ KEYS ============ */}
        {tab === "keys" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-[#1f2a44] dark:bg-[#131c33]">
            <p className="text-xs font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-400">
              Payment API keys
            </p>

            <div className="mt-5 space-y-5">
              <Field
                label="Paystack Public Key"
                hint="Safe to display — used on the frontend. Starts with pk_test_ or pk_live_"
              >
                <input
                  className={inputCls}
                  value={form.paystack_public_key ?? ""}
                  onChange={(e) =>
                    update("paystack_public_key", e.target.value)
                  }
                  placeholder="pk_test_xxxxxxxxxxxxxxxxxxxx"
                />
              </Field>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40">
                <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                  ⚠ Secret key
                </p>
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                  The <code>PAYSTACK_SECRET_KEY</code> is stored in environment
                  variables, never in the database. Add it to{" "}
                  <code>.env.local</code> and Vercel:
                  <br />
                  <code className="mt-1 inline-block">
                    PAYSTACK_SECRET_KEY=sk_test_...
                  </code>
                </p>
              </div>

              <Field label="Currency">
                <select
                  className={inputCls}
                  value={form.currency}
                  onChange={(e) => update("currency", e.target.value)}
                >
                  <option value="NGN">Nigerian Naira (NGN)</option>
                  <option value="USD">US Dollar (USD)</option>
                  <option value="GHS">Ghanaian Cedi (GHS)</option>
                  <option value="KES">Kenyan Shilling (KES)</option>
                </select>
              </Field>

              <Field
                label="Support email"
                hint="Shown to users on payment issues"
              >
                <input
                  className={inputCls}
                  value={form.paystack_public_key ?? ""}
                  onChange={(e) =>
                    update("paystack_public_key", e.target.value)
                  }
                  placeholder="aliyuabubakar11117@gmail.com"
                />
              </Field>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}