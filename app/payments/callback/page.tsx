import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";

export default async function PaymentCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  const params = await searchParams;
  const reference = params.reference;

  const supabase = await createClient();
  const { data: payment } = reference
    ? await supabase
        .from("payments")
        .select("status, type, target_id, metadata")
        .eq("reference", reference)
        .maybeSingle()
    : { data: null };

  const success = payment?.status === "success";
  const pending = payment?.status === "pending";

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-20 text-center sm:px-8">
        <div
          className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
            success
              ? "bg-emerald-100 dark:bg-emerald-950/60"
              : pending
              ? "bg-amber-100 dark:bg-amber-950/60"
              : "bg-red-100 dark:bg-red-950/60"
          }`}
        >
          <span className="text-4xl">
            {success ? "✓" : pending ? "⏳" : "✕"}
          </span>
        </div>

        <h1 className="mt-6 text-3xl font-black dark:text-[#f1f5f9]">
          {success
            ? "Payment successful"
            : pending
            ? "Verifying payment…"
            : "Payment not completed"}
        </h1>

        <p className="mt-3 text-slate-600 dark:text-[#94a3b8]">
          {success
            ? "Your payment was received. Your access is now available."
            : pending
            ? "Please wait a moment while we confirm your payment with the provider."
            : "We could not confirm your payment. If you were charged, contact support."}
        </p>

        {reference && (
          <p className="mt-4 break-all font-mono text-xs text-slate-500 dark:text-[#94a3b8]">
            Reference: {reference}
          </p>
        )}

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/dashboard"
            className="rounded-full bg-blue-700 px-7 py-3.5 font-bold text-white hover:bg-blue-800 dark:bg-blue-600"
          >
            Go to dashboard →
          </Link>
          <Link
            href="/"
            className="rounded-full border border-slate-200 bg-white px-7 py-3.5 font-bold text-slate-700 hover:bg-slate-50 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1]"
          >
            Back to home
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}