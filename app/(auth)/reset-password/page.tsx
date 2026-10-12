"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { resetPassword, type ActionState } from "../actions";
import { createClient } from "@/lib/supabase/client";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import PasswordStrength from "@/components/ui/PasswordStrength";
import { LockIcon } from "@/components/ui/Icons";

export default function ResetPasswordPage() {
  const [state, formAction] = useActionState<ActionState, FormData>(
    resetPassword,
    null
  );
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const router = useRouter();

  // Supabase puts a `code` (PKCE) or `access_token` in the URL hash after
  // the user clicks the email link. The Supabase client picks it up
  // automatically when it initializes.
  useEffect(() => {
    const supabase = createClient();

    // Listen for the recovery session
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    // Also check if already authenticated (in case of a fast redirect)
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setReady(true);
    });

    // If nothing happens in 3s, show error
    const t = setTimeout(() => {
      supabase.auth.getUser().then(({ data }) => {
        if (!data.user) {
          setError(
            "This reset link is invalid or has expired. Request a new one."
          );
        } else {
          setReady(true);
        }
      });
    }, 3000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(t);
    };
  }, []);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/40 to-white px-5 py-10 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
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

          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-[#f1f5f9]">
            Set a new password.
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-[#94a3b8]">
            Choose a strong password for your account.
          </p>

          {!ready && !error && (
            <div className="mt-8 flex flex-col items-center gap-3">
              <span className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
              <p className="text-sm text-slate-600 dark:text-[#94a3b8]">
                Verifying your reset link…
              </p>
            </div>
          )}

          {error && (
            <div className="mt-6">
              <Alert type="error">{error}</Alert>
              <Link
                href="/forgot-password"
                className="mt-4 inline-block text-sm font-bold text-blue-700 hover:text-blue-900 dark:text-blue-400"
              >
                Request a new link →
              </Link>
            </div>
          )}

          {ready && (
            <>
              {state?.error && (
                <div className="mt-6">
                  <Alert type="error">{state.error}</Alert>
                </div>
              )}
              {state?.success && (
                <div className="mt-6">
                  <Alert type="success">{state.success}</Alert>
                </div>
              )}

              <form action={formAction} className="mt-7 space-y-5">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  label="New password"
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  icon={<LockIcon />}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <PasswordStrength value={password} />

                <Input
                  id="confirm"
                  name="confirm"
                  type="password"
                  label="Confirm new password"
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  icon={<LockIcon />}
                />

                <div className="pt-2">
                  <Button type="submit">Update password →</Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}