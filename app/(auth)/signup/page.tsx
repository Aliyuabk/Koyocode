"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup, type ActionState } from "../actions";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { MailIcon, LockIcon, UserIcon } from "@/components/ui/Icons";
import ThemeSwitcher from "@/components/ThemeSwitcher";

export default function SignupPage() {
  const [state, formAction] = useActionState<ActionState, FormData>(signup, null);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/40 to-white px-5 py-10 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="absolute right-5 top-5">
        <ThemeSwitcher />
      </div>

      <div className="w-full max-w-md animate-fade-up">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl shadow-blue-900/5 sm:p-10 dark:border-slate-800 dark:bg-slate-900 dark:shadow-blue-950/30">
          <Link href="/" className="mb-8 inline-flex items-center gap-2.5">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700 text-xl font-black text-white shadow-lg shadow-blue-700/25 dark:bg-blue-600">
              K
            </span>
            <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Koyo<span className="text-blue-600 dark:text-blue-400">Code</span>
            </span>
          </Link>

          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
            Create your free account.
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
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
              placeholder="e.g. Aisha Bello"
              autoComplete="name"
              required
              icon={<UserIcon />}
            />

            <Input
              id="email"
              name="email"
              type="email"
              label="Email address"
              placeholder="you@example.com"
              autoComplete="email"
              required
              icon={<MailIcon />}
            />

            <Input
              id="password"
              name="password"
              type="password"
              label="Password"
              placeholder="At least 6 characters"
              autoComplete="new-password"
              required
              minLength={6}
              icon={<LockIcon />}
            />

            <label className="flex items-start gap-2.5 pt-1 text-sm text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                required
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800"
              />
              <span>
                I agree to the{" "}
                <Link href="/terms" className="font-semibold text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="font-semibold text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>

            <div className="pt-2">
              <Button type="submit">Create account →</Button>
            </div>
          </form>

          <div className="my-7 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Already have an account?
            </span>
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          </div>

          <Link
            href="/login"
            className="block w-full rounded-xl border border-slate-200 bg-white py-3.5 text-center text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-blue-600 dark:hover:bg-slate-700 dark:hover:text-blue-400"
          >
            Log in instead
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          Free forever. No credit card required.
        </p>
      </div>
    </div>
  );
}