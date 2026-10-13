import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CertificateView from "@/components/CertificateView";
import BuyButton from "@/components/BuyButton";
import { createClient } from "@/lib/supabase/server";
import { getCourseBySlug } from "@/lib/queries";
import { getPublicSettings, koboToNaira } from "@/lib/settings";

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

  // Look up the certificate
  const { data: cert } = await supabase
    .from("certificates")
    .select("id, verification_code, issued_at, is_paid")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .maybeSingle();

  // Not eligible yet?
  if (!cert) {
    const { data: attempt } = await supabase
      .from("exam_attempts")
      .select("score, passed")
      .eq("user_id", user.id)
      .eq("course_id", course.id)
      .maybeSingle();

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
            {attempt?.passed
              ? "You passed — your certificate is being prepared. Refresh in a moment."
              : "Pass the final exam to earn your certificate."}
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

  // Course-level certificate price (fallback to platform default)
  const priceKobo =
    course.certificate_price_kobo ??
    settings.certificate_default_price_kobo;

  const requiresPayment =
    settings.certificate_enabled &&
    settings.certificate_require_payment &&
    !cert.is_paid &&
    priceKobo > 0;

  // ===== PAYWALL =====
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

  // ===== UNLOCKED =====
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { data: attempt } = await supabase
    .from("exam_attempts")
    .select("score")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .maybeSingle();

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