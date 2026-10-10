"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { updateProfile, type ProfileState } from "@/app/(auth)/actions";
import { createClient } from "@/lib/supabase/client";
import { useTheme, type ThemeMode, type Accent } from "@/components/ThemeProvider";
import Navbar from "@/components/Navbar";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import Avatar from "@/components/ui/Avatar";
import { UserIcon } from "@/components/ui/Icons";

const modes: { key: ThemeMode; label: string; description: string; icon: string }[] = [
  { key: "light",  label: "Light",  description: "Bright and clear",   icon: "☀️" },
  { key: "dark",   label: "Dark",   description: "Easier on the eyes", icon: "🌙" },
  { key: "system", label: "System", description: "Match your device",  icon: "💻" },
];

const accents: { key: Accent; label: string; swatch: string }[] = [
  { key: "blue",    label: "Blue",    swatch: "#2563eb" },
  { key: "emerald", label: "Emerald", swatch: "#059669" },
  { key: "purple",  label: "Purple",  swatch: "#7c3aed" },
  { key: "rose",    label: "Rose",    swatch: "#e11d48" },
  { key: "amber",   label: "Amber",   swatch: "#d97706" },
];

export default function SettingsPage() {
  const [state, formAction] = useActionState<ProfileState, FormData>(
    updateProfile,
    null
  );
  const { mode, accent, setMode, setAccent } = useTheme();

  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [joined, setJoined] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, role, created_at")
        .eq("id", user.id)
        .single();

      if (profile) {
        setName(profile.full_name ?? "");
        setAvatarUrl(profile.avatar_url ?? "");
        setRole(profile.role ?? "student");
        if (profile.created_at) {
          setJoined(
            new Date(profile.created_at).toLocaleDateString("en-GB", {
              month: "long",
              year: "numeric",
            })
          );
        }
      }
      setLoading(false);
    })();
  }, []);

  return (
    <>
      <Navbar />

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
        <Link
          href="/dashboard"
          className="text-sm font-bold text-blue-700 transition hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
        >
          ← Back to dashboard
        </Link>

        <div className="mt-4 animate-fade-up">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-[#f1f5f9]">
            Settings
          </h1>
          <p className="mt-2 text-slate-600 dark:text-[#94a3b8]">
            Manage your profile, appearance, and account.
          </p>
        </div>

        {/* PROFILE PREVIEW */}
        <div
          className="mt-8 flex items-center gap-5 rounded-2xl border border-slate-200 bg-white p-6 animate-fade-up dark:border-[#1f2a44] dark:bg-[#131c33]"
          style={{ animationDelay: "0.05s" }}
        >
          <Avatar
            src={avatarUrl}
            name={name}
            email={email}
            size="xl"
            className="ring-4 ring-white shadow-xl shadow-blue-900/10 dark:ring-[#0a0e1a]"
          />
          <div className="min-w-0">
            <p className="truncate text-lg font-black text-slate-900 dark:text-[#f1f5f9]">
              {name || "Your name"}
            </p>
            <p className="truncate text-sm text-slate-600 dark:text-[#94a3b8]">
              {email || "you@example.com"}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {role && (
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold capitalize text-blue-700 dark:bg-[#16233d] dark:text-blue-400">
                  {role}
                </span>
              )}
              {joined && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-[#1b2742] dark:text-[#94a3b8]">
                  Joined {joined}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* APPEARANCE */}
        <div
          className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 animate-fade-up dark:border-[#1f2a44] dark:bg-[#131c33]"
          style={{ animationDelay: "0.08s" }}
        >
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-[#f1f5f9]">
            Appearance
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-[#94a3b8]">
            Choose how KoyoCode looks for you. Saved to your account.
          </p>

          <p className="mt-6 text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-[#94a3b8]">
            Theme
          </p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {modes.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMode(m.key)}
                className={`group relative overflow-hidden rounded-xl border p-4 text-left transition ${
                  mode === m.key
                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100 dark:border-blue-500 dark:bg-[#16233d] dark:ring-blue-900/50"
                    : "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:hover:border-blue-600 dark:hover:bg-[#1b2742]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{m.icon}</span>
                  <div>
                    <p
                      className={`text-sm font-bold ${
                        mode === m.key
                          ? "text-blue-700 dark:text-blue-400"
                          : "text-slate-900 dark:text-[#f1f5f9]"
                      }`}
                    >
                      {m.label}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-[#94a3b8]">
                      {m.description}
                    </p>
                  </div>
                </div>

                {mode === m.key && (
                  <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>

          <p className="mt-8 text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-[#94a3b8]">
            Accent colour
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {accents.map((a) => (
              <button
                key={a.key}
                type="button"
                onClick={() => setAccent(a.key)}
                aria-label={a.label}
                title={a.label}
                className={`flex h-11 w-11 items-center justify-center rounded-full transition hover:scale-110 ${
                  accent === a.key
                    ? "ring-2 ring-slate-900 ring-offset-2 ring-offset-white dark:ring-[#f1f5f9] dark:ring-offset-[#131c33]"
                    : ""
                }`}
                style={{ backgroundColor: a.swatch }}
              >
                {accent === a.key && (
                  <span className="text-white drop-shadow">✓</span>
                )}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500 dark:text-[#94a3b8]">
            Current accent: <span className="font-bold capitalize">{accent}</span>
          </p>
        </div>

        {/* PROFILE FORM */}
        <div
          className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 animate-fade-up dark:border-[#1f2a44] dark:bg-[#131c33]"
          style={{ animationDelay: "0.1s" }}
        >
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-[#f1f5f9]">
            Profile
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-[#94a3b8]">
            This information appears on your dashboard and certificates.
          </p>

          <div className="mt-6">
            {state?.error && <Alert type="error">{state.error}</Alert>}
            {state?.success && <Alert type="success">{state.success}</Alert>}

            {loading ? (
              <div className="space-y-4">
                <div className="h-16 rounded-xl skeleton" />
                <div className="h-16 rounded-xl skeleton" />
                <div className="h-16 rounded-xl skeleton" />
              </div>
            ) : (
              <form action={formAction} className="space-y-5">
                <Input
                  id="full_name"
                  name="full_name"
                  type="text"
                  label="Full name"
                  placeholder="e.g. Aliyu Abubakar"
                  required
                  icon={<UserIcon />}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <Input
                  id="avatar_url"
                  name="avatar_url"
                  type="url"
                  label="Avatar URL (optional)"
                  placeholder="https://example.com/photo.jpg"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                />

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-[#cbd5e1]">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-500 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#64748b]"
                  />
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-[#64748b]">
                    Email cannot be changed in this version.
                  </p>
                </div>

                <div className="pt-2">
                  <Button type="submit">Save changes</Button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* DANGER ZONE */}
        <div
          className="mt-6 rounded-2xl border border-red-200 bg-red-50/50 p-6 animate-fade-up dark:border-red-900/60 dark:bg-red-950/20"
          style={{ animationDelay: "0.15s" }}
        >
          <h2 className="font-bold text-red-800 dark:text-red-400">Danger zone</h2>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">
            Logging out will require you to log in again.
          </p>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="mt-4 rounded-xl border border-red-300 bg-white px-5 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-100 dark:border-red-800 dark:bg-[#0e1526] dark:text-red-400 dark:hover:bg-red-950/40"
            >
              Log out of all devices
            </button>
          </form>
        </div>
      </main>
    </>
  );
}