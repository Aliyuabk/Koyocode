"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type Status = "verifying" | "success" | "failed" | "pending";

export default function PaymentCallbackPage() {
  const params = useSearchParams();
  const reference = params.get("reference");

  const [status, setStatus] = useState<Status>("verifying");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reference) {
      setStatus("failed");
      setError("Missing payment reference");
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 6;

    async function check() {
      attempts++;
      try {
        const res = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference }),
        });

        const data = await res.json();

        if (cancelled) return;

        if (data.ok) {
          setStatus("success");
          return;
        }

        if (attempts < maxAttempts) {
          setTimeout(check, 2000);
        } else {
          setStatus("pending");
          setError(
            data.status === "failed"
              ? "Payment was declined or cancelled"
              : "We could not confirm your payment within the expected time"
          );
        }
      } catch (e: any) {
        if (cancelled) return;
        if (attempts < maxAttempts) setTimeout(check, 2000);
        else {
          setStatus("failed");
          setError(e.message);
        }
      }
    }

    check();

    return () => {
      cancelled = true;
    };
  }, [reference]);

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-20 text-center sm:px-8">
        <div
          className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
            status === "success"
              ? "bg-emerald-100 dark:bg-emerald-950/60"
              : status === "verifying"
              ? "bg-blue-100 dark:bg-blue-950/60"
              : status === "pending"
              ? "bg-amber-100 dark:bg-amber-950/60"
              : "bg-red-100 dark:bg-red-950/60"
          }`}
        >
          {status === "verifying" ? (
            <span className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          ) : (
            <span className="text-4xl">
              {status === "success" ? "✓" : status === "pending" ? "⏳" : "✕"}
            </span>
          )}
        </div>

        <h1 className="mt-6 text-3xl font-black dark:text-[#f1f5f9]">
          {status === "verifying"
            ? "Confirming your payment…"
            : status === "success"
            ? "Payment successful"
            : status === "pending"
            ? "Payment is pending"
            : "Payment not completed"}
        </h1>

        <p className="mt-3 text-slate-600 dark:text-[#94a3b8]">
          {status === "verifying"
            ? "Please wait while we confirm with the payment provider. This usually takes 5–10 seconds."
            : status === "success"
            ? "Your payment was received. Access has been granted."
            : status === "pending"
            ? "Your payment is being processed. If your account was debited, access will be granted automatically within a few minutes."
            : error ?? "We could not confirm your payment."}
        </p>

        {reference && (
          <p className="mt-4 break-all font-mono text-xs text-slate-500 dark:text-[#94a3b8]">
            Reference: {reference}
          </p>
        )}

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          {status === "success" && (
            <Link
              href="/dashboard"
              className="rounded-full bg-blue-700 px-7 py-3.5 font-bold text-white hover:bg-blue-800 dark:bg-blue-600"
            >
              Go to dashboard →
            </Link>
          )}
          {status === "pending" && (
            <button
              onClick={() => location.reload()}
              className="rounded-full bg-amber-600 px-7 py-3.5 font-bold text-white hover:bg-amber-700"
            >
              Check again
            </button>
          )}
          <Link
            href="/"
            className="rounded-full border border-slate-200 bg-white px-7 py-3.5 font-bold text-slate-700 hover:bg-slate-50 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1]"
          >
            Back to home
          </Link>
        </div>

        {status !== "success" && status !== "verifying" && (
          <p className="mt-8 text-xs text-slate-500 dark:text-[#94a3b8]">
            Charged but no access? Email{" "}
            <a
              href="mailto:aliyuabubakar11117@gmail.com"
              className="font-bold text-blue-700 dark:text-blue-400"
            >
              aliyuabubakar11117@gmail.com
            </a>{" "}
            with your reference.
          </p>
        )}
      </main>
      <Footer />
    </>
  );
}