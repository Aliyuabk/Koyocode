import CopyLinkButton from "@/components/CopyLinkButton";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();

  const { data: cert } = await supabase
    .from("certificates")
    .select(
      `id, issued_at, verification_code,
       user:profiles(full_name, avatar_url),
       course:courses(title, icon, category, level)`
    )
    .eq("verification_code", code)
    .maybeSingle();

  /* ============================================================
     NOT FOUND
     ============================================================ */
  if (!cert) {
    return (
      <>
        <Navbar />
        <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-20 text-center sm:px-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/60">
            <span className="text-4xl">❌</span>
          </div>
          <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-900 dark:text-[#f1f5f9]">
            Certificate not found
          </h1>
          <p className="mt-3 text-slate-600 dark:text-[#94a3b8]">
            The code <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:bg-[#1b2742]">{code.slice(0, 20)}</code> doesn&apos;t match any certificate in our records.
          </p>
          <p className="mt-2 text-sm text-slate-500 dark:text-[#94a3b8]">
            If you believe this is an error, contact{" "}
            <a
              href="mailto:support@koyocode.com.ng"
              className="font-semibold text-blue-700 hover:underline dark:text-blue-400"
            >
              support@koyocode.com.ng
            </a>
          </p>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="rounded-full bg-blue-700 px-7 py-3.5 font-bold text-white transition hover:bg-blue-800 dark:bg-blue-600"
            >
              Back to KoyoCode
            </Link>
            <Link
              href="/courses"
              className="rounded-full border border-slate-300 bg-white px-7 py-3.5 font-bold text-slate-700 transition hover:bg-slate-50 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1]"
            >
              Browse courses
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const profile = Array.isArray(cert.user) ? cert.user[0] : cert.user;
  const course = Array.isArray(cert.course) ? cert.course[0] : cert.course;

  const issuedDate = new Date(cert.issued_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const initials = (profile?.full_name ?? "?")
    .split(" ")
    .map((s: string) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  /* ============================================================
     VERIFIED
     ============================================================ */
  return (
    <>
      <Navbar />

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
        {/* ==================== HERO BANNER ==================== */}
        <div className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white p-8 text-center dark:border-emerald-800 dark:from-emerald-950/40 dark:via-[#0a0e1a] dark:to-[#0a0e1a]">
          {/* decorative pulse dot */}
          <div className="absolute right-6 top-6 flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-sm dark:bg-emerald-950/60 dark:text-emerald-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Verified
          </div>

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60">
            <svg
              className="h-10 w-10 text-emerald-600 dark:text-emerald-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>

          <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl dark:text-[#f1f5f9]">
            Certificate verified
          </h1>
          <p className="mt-3 text-slate-600 dark:text-[#94a3b8]">
            This is a genuine KoyoCode certificate, issued by New Generation
            Tech Academy.
          </p>

          <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/20">
            <span>🔒</span> Issued on {issuedDate}
          </div>
        </div>

        {/* ==================== HOLDER CARD ==================== */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-[#1f2a44] dark:bg-[#131c33]">
          {/* header strip */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-blue-50 to-transparent px-6 py-4 dark:border-[#1f2a44] dark:from-blue-950/30 dark:to-transparent">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
              Certificate holder
            </p>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-black uppercase text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
              {course?.category ?? "Course"}
            </span>
          </div>

          <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
            {/* avatar */}
            <div className="flex justify-center sm:block">
              <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-600 to-blue-800 text-2xl font-black text-white shadow-xl shadow-blue-900/20">
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt={profile?.full_name ?? "Student"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials
                )}
              </span>
            </div>

            {/* info */}
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <p className="text-xl font-black text-slate-900 dark:text-[#f1f5f9]">
                {profile?.full_name ?? "Student"}
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-[#94a3b8]">
                Completed {course?.title ?? "course"} on KoyoCode
              </p>

              <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-[#1b2742] dark:text-[#cbd5e1]">
                  {course?.icon} {course?.level}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== CREDENTIAL DETAILS ==================== */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-[#1f2a44] dark:bg-[#131c33]">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
            Credential details
          </p>

          <dl className="mt-5 space-y-4 text-sm">
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-3 dark:border-[#1f2a44]">
              <dt className="text-slate-500 dark:text-[#94a3b8]">Course</dt>
              <dd className="text-right font-bold text-slate-900 dark:text-[#f1f5f9]">
                {course?.icon} {course?.title}
              </dd>
            </div>

            <div className="flex justify-between gap-4 border-b border-slate-100 pb-3 dark:border-[#1f2a44]">
              <dt className="text-slate-500 dark:text-[#94a3b8]">Issued by</dt>
              <dd className="text-right font-bold text-slate-900 dark:text-[#f1f5f9]">
                KoyoCode · New Generation Tech Academy
              </dd>
            </div>

            <div className="flex justify-between gap-4 border-b border-slate-100 pb-3 dark:border-[#1f2a44]">
              <dt className="text-slate-500 dark:text-[#94a3b8]">Issue date</dt>
              <dd className="text-right font-bold text-slate-900 dark:text-[#f1f5f9]">
                {issuedDate}
              </dd>
            </div>

            <div className="flex justify-between gap-4">
              <dt className="text-slate-500 dark:text-[#94a3b8]">
                Verification code
              </dt>
              <dd className="break-all text-right font-mono text-xs text-slate-700 dark:text-[#cbd5e1]">
                {cert.verification_code}
              </dd>
            </div>
          </dl>
        </div>

        {/* ==================== CRYPTO-FREE INTEGRITY BLOCK ==================== */}
        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-6 dark:border-[#1f2a44] dark:bg-[#10182b]">
          <div className="flex items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
              🔐
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-black text-slate-900 dark:text-[#f1f5f9]">
                How we verify
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-[#94a3b8]">
                This certificate was issued by KoyoCode&apos;s system after the
                holder completed all lessons and passed the final exam. The
                verification code above is unique and permanently tied to this
                credential. Anyone with the URL{" "}
                <span className="break-all font-mono text-xs text-blue-700 dark:text-blue-400">
                  /verify/{code.slice(0, 12)}...
                </span>{" "}
                can confirm its authenticity.
              </p>
            </div>
          </div>
        </div>

        {/* ==================== ACTIONS ==================== */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <CopyLinkButton />

          <Link
            href="/courses"
            className="rounded-full bg-blue-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-800 dark:bg-blue-600"
          >
            Explore KoyoCode courses →
          </Link>
        </div>

        {/* ==================== FOOTER NOTE ==================== */}
        <p className="mt-10 text-center text-xs text-slate-500 dark:text-[#94a3b8]">
          KoyoCode · New Generation Tech Academy ·{" "}
          <a
            href="mailto:support@koyocode.com.ng"
            className="font-semibold text-blue-700 hover:underline dark:text-blue-400"
          >
            support@koyocode.com.ng
          </a>
        </p>
      </main>

      <Footer />
    </>
  );
}