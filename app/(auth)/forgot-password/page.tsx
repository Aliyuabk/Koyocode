"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotPassword, type ActionState } from "../actions";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { MailIcon } from "@/components/ui/Icons";
import ThemeSwitcher from "@/components/ThemeSwitcher";

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState<ActionState, FormData>(
    forgotPassword,
    null
  );

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/40 to-white px-5 py-10 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="absolute right-5 top-5">
        <ThemeSwitcher />
      </div>

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
            Forgot your password?
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-[#94a3b8]">
            Enter your email and we&apos;ll send you a link to reset it.
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
              id="email"
              name="email"
              type="email"
              label="Email address"
              placeholder="you@example.com"
              autoComplete="email"
              required
              icon={<MailIcon />}
            />

            <div className="pt-2">
              <Button type="submit">Send reset link →</Button>
            </div>
          </form>

          <div className="mt-7 text-center">
            <Link
              href="/login"
              className="text-sm font-bold text-blue-700 hover:text-blue-900 dark:text-blue-400"
            >
              ← Back to log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}