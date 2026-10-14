"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function VerifyEmailPage() {
  const supabase = createClient();
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function resend() {
    setResending(true);
    setMessage(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      setMessage("You need to be logged in first.");
      setResending(false);
      return;
    }

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: user.email,
    });

    setResending(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Confirmation email resent. Check your inbox.");
  }

  async function checkNow() {
    await supabase.auth.refreshSession();
    window.location.href = "/dashboard";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10 dark:bg-[#0a0e1a]">
      <div className="w-full max-w-md animate-fade-up">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl shadow-blue-900/5 sm:p-10 dark:border-[#1f2a44] dark:bg-[#131c33]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-950/60">
            <span className="text-3xl">✉️</span>
          </div>

          <h1 className="mt-6 text-center text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-[#f1f5f9]">
            Confirm your email
          </h1>

          <p className="mt-3 text-center text-sm text-slate-600 dark:text-[#94a3b8]">
            We sent a confirmation link to your email. Click it to activate
            your account, then come back.
          </p>

          {message && (
            <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
              {message}
            </div>
          )}

          <div className="mt-8 space-y-3">
            <button
              onClick={checkNow}
              className="w-full rounded-xl bg-blue-700 px-4 py-3.5 font-bold text-white transition hover:bg-blue-800 dark:bg-blue-600"
            >
              I&apos;ve confirmed — continue →
            </button>

            <button
              onClick={resend}
              disabled={resending}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1]"
            >
              {resending ? "Sending…" : "Resend confirmation email"}
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500 dark:text-[#94a3b8]">
            Didn&apos;t get the email? Check spam, or contact{" "}
            <a
              href="mailto:koyocode@kowagurutech.ng"
              className="font-bold text-blue-700 dark:text-blue-400"
            >
              koyocode@kowagurutech.ng
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}