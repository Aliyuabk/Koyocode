import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CertificateView from "@/components/CertificateView";
import { createClient } from "@/lib/supabase/server";
import { getCourseBySlug } from "@/lib/queries";

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

  if (!user) {
    redirect(`/login?next=/courses/${slug}/certificate`);
  }

  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  // Look up the certificate
  const { data: cert } = await supabase
    .from("certificates")
    .select("id, verification_code, issued_at")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .maybeSingle();

  // No certificate yet
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
              ? "You passed — but the certificate was not issued. Open your exam result below to trigger it."
              : "Pass the final exam to earn your certificate."}
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href={`/courses/${slug}/exam`}
              className="rounded-full bg-blue-700 px-7 py-3.5 font-bold text-white transition hover:bg-blue-800 dark:bg-blue-600"
            >
              {attempt ? "Open my exam result" : "Take final exam"} →
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

  // Get student profile + score
  const [{ data: profile }, { data: attempt }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single(),
    supabase
      .from("exam_attempts")
      .select("score")
      .eq("user_id", user.id)
      .eq("course_id", course.id)
      .maybeSingle(),
  ]);

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
        <Link
          href={`/courses/${slug}`}
          className="text-sm font-bold text-blue-700 transition hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 print:hidden"
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