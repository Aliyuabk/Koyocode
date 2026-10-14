"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signup, type ActionState } from "../actions";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import PasswordStrength from "@/components/ui/PasswordStrength";
import { MailIcon, LockIcon, UserIcon } from "@/components/ui/Icons";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { isStrongEnough } from "@/lib/password";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupPage() {
  const [state, formAction] = useActionState<ActionState, FormData>(signup, null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);

  const isEmailValid = EMAIL_RE.test(email.trim());
  const isNameValid = fullName.trim().length >= 2;
  const isPasswordValid = isStrongEnough(password);
  const isFormValid = isEmailValid && isNameValid && isPasswordValid && agreed;

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/40 to-white px-5 py-10 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="absolute right-5 top-5">
        <ThemeSwitcher />
      </div>

      <div className="w-full max-w-md animate-fade-up">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl shadow-blue-900/5 sm:p-10 dark:border-[#1f2a44] dark:bg-[#131c33] dark:shadow-black/40">
          <Link href="/" className="mb-8 inline-flex items-center gap-2.5">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700 text-xl font-black text-white shadow-lg shadow-blue-700/25 dark:bg-blue-600">
              K
            </span>
            <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-[#f1f5f9]">
              Koyo<span className="text-blue-600 dark:text-blue-400">Code</span>
            </span>
          </Link>

          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-[#f1f5f9]">
            Create your free account.
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-[#94a3b8]">
            Start learning to code in Hausa and English.
          </p>

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
              id="full_name"
              name="full_name"
              type="text"
              label="Full name"
              placeholder="e.g. Isah Musa"
              autoComplete="name"
              required
              icon={<UserIcon />}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <div>
              <Input
                id="email"
                name="email"
                type="email"
                label="Email address"
                placeholder="you@example.com"
                autoComplete="email"
                required
                icon={<MailIcon />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {email.trim() && !isEmailValid && (
                <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
                  ⚠ Please enter a valid email address
                </p>
              )}
              {email.trim() && isEmailValid && (
                <p className="mt-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  ✓ Valid email format
                </p>
              )}
            </div>

            <div>
              <Input
                id="password"
                name="password"
                type="password"
                label="Password"
                placeholder="At least 8 characters"
                autoComplete="new-password"
                required
                minLength={8}
                icon={<LockIcon />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <PasswordStrength value={password} />
            </div>

            <label className="flex items-start gap-2.5 pt-1 text-sm text-slate-600 dark:text-[#94a3b8]">
              <input
                type="checkbox"
                required
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500 dark:border-[#1f2a44] dark:bg-[#0e1526]"
              />
              <span>
                I agree to the{" "}
                <Link
                  href="/terms"
                  className="font-semibold text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Terms
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="font-semibold text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Privacy Policy
                </Link>
                .
              </span>
            </label>

            <div className="pt-2">
              <Button type="submit" disabled={!isFormValid}>
                Create account →
              </Button>
            </div>

            {!isFormValid && (
              <p className="text-center text-xs text-slate-500 dark:text-[#94a3b8]">
                Please complete all required fields to enable submission.
              </p>
            )}
          </form>

          <div className="my-7 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200 dark:bg-[#1f2a44]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-[#64748b]">
              Already have an account?
            </span>
            <span className="h-px flex-1 bg-slate-200 dark:bg-[#1f2a44]" />
          </div>

          <Link
            href="/login"
            className="block w-full rounded-xl border border-slate-200 bg-white py-3.5 text-center text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1] dark:hover:border-blue-600 dark:hover:bg-[#1b2742] dark:hover:text-blue-400"
          >
            Log in instead
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500 dark:text-[#94a3b8]">
          Free forever. No credit card required.
        </p>
      </div>
    </div>
  );
}