import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CertificateView from "@/components/CertificateView";
import BuyButton from "@/components/BuyButton";
import { createClient } from "@/lib/supabase/server";
import { getCourseBySlug } from "@/lib/queries";
import { getPublicSettings, koboToNaira } from "@/lib/settings";
import { issueCertificateForUser } from "@/lib/certificates";

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/courses/${slug}/certificate`);

  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const settings = await getPublicSettings();

  // Fetch cert + attempt + platform flags + profile in parallel
  const [
    { data: cert },
    { data: attempt },
    { data: platform },
    { data: profile },
  ] = await Promise.all([
    supabase
      .from("certificates")
      .select("id, verification_code, issued_at, is_paid")
      .eq("user_id", user.id)
      .eq("course_id", course.id)
      .maybeSingle(),
    supabase
      .from("exam_attempts")
      .select("score, passed, completed_at")
      .eq("user_id", user.id)
      .eq("course_id", course.id)
      .maybeSingle(),
    supabase
      .from("platform_settings")
      .select("certificate_enabled, certificate_auto_issue_on_pass")
      .eq("id", 1)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .single(),
  ]);

  const isAdmin = profile?.role === "admin";

  /* ==================== NOT ISSUED YET ==================== */
  if (!cert) {
    const passed = attempt?.passed === true;
    const certEnabled = course.certificate_enabled;
    const autoIssue = platform?.certificate_auto_issue_on_pass === true;

    // ---- Case 1: certificate disabled for this course ----
    if (!certEnabled) {
      return (
        <>
          <Navbar />
          <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-16 text-center sm:px-8">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-[#1b2742]">
              <span className="text-4xl">🚫</span>
            </div>
            <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-900 dark:text-[#f1f5f9]">
              Certificate not available
            </h1>
            <p className="mt-3 text-slate-600 dark:text-[#94a3b8]">
              Certificates are not enabled for this course.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href={`/courses/${slug}`}
                className="rounded-full bg-blue-700 px-7 py-3.5 font-bold text-white transition hover:bg-blue-800 dark:bg-blue-600"
              >
                Back to course
              </Link>
            </div>
          </main>
          <Footer />
        </>
      );
    }

    // ---- Case 2: hasn't passed yet ----
    if (!passed) {
      return (
        <>
          <Navbar />
          <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-16 text-center sm:px-8">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/60">
              <span className="text-4xl">🎓</span>
            </div>
            <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-900 dark:text-[#f1f5f9]">
              Certificate locked
            </h1>
            <p className="mt-3 text-slate-600 dark:text-[#94a3b8]">
              Pass the final exam to earn your certificate.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href={`/courses/${slug}/exam`}
                className="rounded-full bg-blue-700 px-7 py-3.5 font-bold text-white transition hover:bg-blue-800 dark:bg-blue-600"
              >
                {attempt ? "View exam result" : "Take final exam"} →
              </Link>
              <Link
                href={`/courses/${slug}`}
                className="rounded-full border border-slate-300 bg-white px-7 py-3.5 font-bold text-slate-700 transition hover:bg-slate-50 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1]"
              >
                Back to course
              </Link>
            </div>
          </main>
          <Footer />
        </>
      );
    }

    // ---- Case 3: passed, no cert row → try to issue NOW (idempotent) ----
    const issueAttempt = await issueCertificateForUser(user.id, course.id);
    if (issueAttempt.ok) {
      // Cert created (or was created concurrently). Re-render → now has cert.
      redirect(`/courses/${slug}/certificate`);
    }

    // Issue failed. Show honest messaging + admin diagnostic.
    return (
      <>
        <Navbar />
        <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-16 text-center sm:px-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/60">
            <span className="text-4xl">🏆</span>
          </div>
          <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-900 dark:text-[#f1f5f9]">
            You passed! 🎉
          </h1>
          <p className="mt-3 text-slate-600 dark:text-[#94a3b8]">
            You scored <strong>{attempt?.score ?? 0}%</strong> on the{" "}
            {course.title} final exam.
          </p>

          {autoIssue ? (
            <p className="mx-auto mt-4 max-w-md rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
              Your certificate is being issued now. Refresh this page in a few
              seconds — if it doesn&apos;t appear, contact support.
            </p>
          ) : (
            <p className="mx-auto mt-4 max-w-md rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              Your certificate will be issued by our team within 24 hours. You
              will receive it at <strong>{user.email}</strong>.
            </p>
          )}

          {/* Admin-only diagnostic — surfaces the exact reason */}
          {isAdmin && (
            <div className="mx-auto mt-4 max-w-lg rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-xs text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
              <p className="font-black uppercase tracking-wider">
                Admin diagnostic
              </p>
              <p className="mt-1 break-all font-mono">
                {issueAttempt.reason}
              </p>
            </div>
          )}

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href={`/courses/${slug}/certificate`}
              className="rounded-full bg-blue-700 px-7 py-3.5 font-bold text-white transition hover:bg-blue-800 dark:bg-blue-600"
            >
              🔄 Check again
            </Link>
            <Link
              href="/dashboard/certificates"
              className="rounded-full border border-slate-300 bg-white px-7 py-3.5 font-bold text-slate-700 transition hover:bg-slate-50 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1]"
            >
              My certificates
            </Link>
          </div>

          <p className="mt-8 text-xs text-slate-500 dark:text-[#94a3b8]">
            Having trouble? Email{" "}
            <a
              href={`mailto:${settings.support_email}`}
              className="font-bold text-blue-700 dark:text-blue-400"
            >
              {settings.support_email}
            </a>
          </p>
        </main>
        <Footer />
      </>
    );
  }

  /* ==================== PAYWALL ==================== */
  const priceKobo =
    course.certificate_price_kobo ?? settings.certificate_default_price_kobo;

  const requiresPayment =
    settings.certificate_enabled &&
    settings.certificate_require_payment &&
    !cert.is_paid &&
    priceKobo > 0;

  if (requiresPayment) {
    return (
      <>
        <Navbar />
        <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-16 sm:px-8">
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center dark:border-emerald-800 dark:bg-emerald-950/30">
            <p className="text-5xl">🏆</p>
            <h1 className="mt-4 text-2xl font-black text-emerald-800 dark:text-emerald-300">
              You earned it!
            </h1>
            <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">
              You passed the {course.title} final exam. Your certificate is
              ready — just unlock it to download.
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-[#1f2a44] dark:bg-[#131c33]">
            <p className="text-xs font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-400">
              Unlock your certificate
            </p>

            <p className="mt-3 text-3xl font-black text-slate-900 dark:text-[#f1f5f9]">
              {koboToNaira(priceKobo, settings.currency)}
            </p>

            <ul className="mt-5 space-y-2 text-sm text-slate-600 dark:text-[#94a3b8]">
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span>
                Verifiable PDF certificate
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span>
                QR code for employer verification
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span>
                Lifetime access to your certificate link
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span>
                Secure payment via Paystack
              </li>
            </ul>

            <div className="mt-6">
              <BuyButton
                type="certificate"
                courseId={course.id}
                label={`Pay ${koboToNaira(priceKobo, settings.currency)} & unlock`}
              />
            </div>

            <p className="mt-3 text-center text-xs text-slate-500 dark:text-[#94a3b8]">
              You can pay with card, Opay, Kuda, USSD, or bank transfer.
            </p>
          </div>

          <p className="mt-8 text-center text-xs text-slate-500 dark:text-[#94a3b8]">
            Having trouble? Email{" "}
            <a
              href={`mailto:${settings.support_email ?? "support@koyocode.com.ng"}`}
              className="font-bold text-blue-700 dark:text-blue-400"
            >
              {settings.support_email ?? "support@koyocode.com.ng"}
            </a>
          </p>
        </main>
        <Footer />
      </>
    );
  }

  /* ==================== UNLOCKED ==================== */
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
        <Link
          href={`/courses/${slug}`}
          className="text-sm font-bold text-blue-700 hover:text-blue-900 dark:text-blue-400 print:hidden"
        >
          ← Back to course
        </Link>

        <div className="mt-6">
          <CertificateView
            studentName={profile?.full_name ?? "Student"}
            courseTitle={course.title}
            courseIcon={course.icon ?? "🎓"}
            verificationCode={cert.verification_code}
            issuedAt={cert.issued_at}
            score={attempt?.score ?? null}
          />
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3 print:hidden">
          <Link
            href="/dashboard/certificates"
            className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1]"
          >
            All my certificates
          </Link>
          <Link
            href="/courses"
            className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1]"
          >
            Browse more courses
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}