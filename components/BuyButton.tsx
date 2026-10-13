"use client";

import { useState } from "react";

export default function BuyButton({
  type,
  courseId,
  label,
  className = "",
}: {
  type: "course" | "certificate";
  courseId: string;
  label?: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBuy() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, course_id: courseId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not start payment");
        setLoading(false);
        return;
      }

      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        setError("Payment provider did not return a checkout URL");
        setLoading(false);
      }
    } catch (e: any) {
      setError(e.message ?? "Network error");
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={handleBuy}
        disabled={loading}
        className={
          className ||
          "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-4 font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:opacity-60"
        }
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Opening checkout…
          </>
        ) : (
          <>{label ?? "Pay now"} →</>
        )}
      </button>

      {error && (
        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
          ⚠ {error}
        </p>
      )}
    </>
  );
}