"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import PasswordStrength from "@/components/ui/PasswordStrength";
import { LockIcon } from "@/components/ui/Icons";
import { isStrongEnough } from "@/lib/password";

export default function ChangePasswordModal({ email }: { email: string }) {
  const supabase = createClient();
  const router = useRouter();

  const [current, setCurrent] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    const { error: verifyErr } = await supabase.auth.signInWithPassword({
      email,
      password: current,
    });

    if (verifyErr) {
      setError("Current password is incorrect.");
      setLoading(false);
      return;
    }

    const { error: updateErr } = await supabase.auth.updateUser({
      password: newPw,
    });

    if (updateErr) {
      setError(updateErr.message);
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from("profiles")
        .update({ password_changed: true })
        .eq("id", user.id);
    }

    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md animate-scale-in rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl dark:border-[#1f2a44] dark:bg-[#131c33]">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/40">
          <p className="text-xs font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-400">
            🎓 First login
          </p>
          <p className="mt-1 text-sm text-blue-800 dark:text-blue-300">
            You&apos;re using a temporary password from your scholarship.
            Please set your own password.
          </p>
        </div>

        <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-900 dark:text-[#f1f5f9]">
          Set your own password
        </h2>

        {error && (
          <div className="mt-4">
            <Alert type="error">{error}</Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <Input
            id="current"
            type="password"
            label="Current password"
            placeholder="Your temporary password"
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
            required
            minLength={8}
            icon={<LockIcon />}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />

          <Button type="submit" disabled={loading}>
            {loading ? "Updating…" : "Save new password →"}
          </Button>
        </form>
      </div>
    </div>
  );
}