"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { login, type ActionState } from "../actions";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { MailIcon, LockIcon } from "@/components/ui/Icons";
import ThemeSwitcher from "@/components/ThemeSwitcher";

export default function LoginPage() {
  const [state, formAction] = useActionState<ActionState, FormData>(login, null);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";

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
            Welcome back.
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-[#94a3b8]">
            Log in to continue your coding journey.
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
            {/* Preserve ?next= across the login POST */}
            <input type="hidden" name="next" value={next} />

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
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              icon={<LockIcon />}
            />

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-[#94a3b8]">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500 dark:border-[#1f2a44] dark:bg-[#0e1526]"
                />
                Remember me
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-semibold text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Forgot password?
              </Link>
            </div>

            <div className="pt-2">
              <Button type="submit">Log in →</Button>
            </div>
          </form>

          <div className="my-7 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200 dark:bg-[#1f2a44]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-[#64748b]">
              New here?
            </span>
            <span className="h-px flex-1 bg-slate-200 dark:bg-[#1f2a44]" />
          </div>

          <Link
            href="/signup"
            className="block w-full rounded-xl border border-slate-200 bg-white py-3.5 text-center text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1] dark:hover:border-blue-600 dark:hover:bg-[#1b2742] dark:hover:text-blue-400"
          >
            Create a free account
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500 dark:text-[#94a3b8]">
          By continuing you agree to our{" "}
          <Link
            href="/terms"
            className="font-semibold text-slate-700 hover:text-blue-700 dark:text-[#cbd5e1] dark:hover:text-blue-400"
          >
            Terms
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="font-semibold text-slate-700 hover:text-blue-700 dark:text-[#cbd5e1] dark:hover:text-blue-400"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}