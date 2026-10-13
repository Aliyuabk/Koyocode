"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import PasswordStrength from "@/components/ui/PasswordStrength";
import { LockIcon } from "@/components/ui/Icons";
import { isStrongEnough } from "@/lib/password";

export default function ChangePasswordPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [current, setCurrent] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFirstChange, setIsFirstChange] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setEmail(data.user.email ?? "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("password_changed")
        .eq("id", data.user.id)
        .single();

      setIsFirstChange(profile?.password_changed === false);
    });
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isStrongEnough(newPw)) {
      setError(
        "Password must be at least 8 characters and include uppercase, lowercase, and a number."
      );
      return;
    }

    if (newPw !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    if (newPw === current) {
      setError("New password must be different from the current one.");
      return;
    }

    setLoading(true);

    try {
      // Verify current password
      const { error: verifyErr } = await supabase.auth.signInWithPassword({
        email,
        password: current,
      });

      if (verifyErr) {
        setError("Current password is incorrect.");
        setLoading(false);
        return;
      }

      // Update password
      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPw,
      });

      if (updateErr) {
        setError(updateErr.message);
        setLoading(false);
        return;
      }

      // Mark password as changed
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from("profiles")
          .update({ password_changed: true })
          .eq("id", user.id);
      }

      router.push("/dashboard");
      router.refresh();
    } catch (e: any) {
      setError(e.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10 dark:bg-[#0a0e1a]">
      <div className="w-full max-w-md animate-fade-up">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl shadow-blue-900/5 sm:p-10 dark:border-[#1f2a44] dark:bg-[#131c33]">
          <Link href="/" className="mb-8 inline-flex items-center gap-2.5">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700 text-xl font-black text-white shadow-lg shadow-blue-700/25 dark:bg-blue-600">
              K
            </span>
            <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-[#f1f5f9]">
              Koyo<span className="text-blue-600 dark:text-blue-400">Code</span>
            </span>
          </Link>

          {isFirstChange && (
            <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/40">
              <p className="text-xs font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                🎓 First login
              </p>
              <p className="mt-1 text-sm text-blue-800 dark:text-blue-300">
                You&apos;re using a temporary password from your scholarship
                approval. Please set your own password to continue.
              </p>
            </div>
          )}

          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-[#f1f5f9]">
            {isFirstChange ? "Set your own password" : "Change your password"}
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-[#94a3b8]">
            {isFirstChange
              ? "Choose a strong password to keep your account secure."
              : "Enter your current password, then choose a new one."}
          </p>

          {error && (
            <div className="mt-6">
              <Alert type="error">{error}</Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <Input
              id="current"
              type="password"
              label="Current password"
              placeholder={
                isFirstChange
                  ? "Your temporary password from the email"
                  : "Your current password"
              }
              required
              icon={<LockIcon />}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />

            <div>
              <Input
                id="new"
                type="password"
                label="New password"
                placeholder="At least 8 characters"
                required
                minLength={8}
                icon={<LockIcon />}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
              />
              <PasswordStrength value={newPw} />
            </div>

            <Input
              id="confirm"
              type="password"
              label="Confirm new password"
              placeholder="Repeat your new password"
              required
              minLength={8}
              icon={<LockIcon />}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />

            <div className="pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Updating…" : "Save new password →"}
              </Button>
            </div>
          </form>

          {!isFirstChange && (
            <div className="mt-6 text-center">
              <Link
                href="/dashboard"
                className="text-sm font-bold text-blue-700 hover:text-blue-900 dark:text-blue-400"
              >
                ← Back to dashboard
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}