import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Always fetch fresh — admin toggles must take effect immediately.
export const dynamic = "force-dynamic";

export default async function CertificatesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ------------------------------------------------------------------
  // 0) PLATFORM SETTINGS — read directly (bypasses any stale view/fallback)
  // ------------------------------------------------------------------
  const { data: platformSettings } = await supabase
    .from("platform_settings")
    .select("certificate_enabled, certificate_require_payment")
    .eq("id", 1)
    .maybeSingle();

  const certEnabled = platformSettings?.certificate_enabled ?? true;
  const requirePayment =
    platformSettings?.certificate_require_payment ?? true;

  // ------------------------------------------------------------------
  // 1) ISSUED CERTIFICATES
  // ------------------------------------------------------------------
  const { data: certs } = await supabase
    .from("certificates")
    .select(
      `id, verification_code, issued_at, is_paid, paid_at,
       course:courses ( id, title, slug, icon, color, certificate_enabled, is_premium )`
    )
    .eq("user_id", user.id)
    .order("issued_at", { ascending: false });

  const issued = (certs ?? [])
    .map((c) => {
      const course = Array.isArray(c.course) ? c.course[0] : c.course;
      return course ? { ...c, course } : null;
    })
    .filter(Boolean) as Array<{
    id: string;
    verification_code: string;
    issued_at: string;
    is_paid: boolean;
    paid_at: string | null;
    course: {
      id: string;
      title: string;
      slug: string;
      icon: string | null;
      color: string | null;
      certificate_enabled: boolean;
      is_premium: boolean;
    };
  }>;

  const issuedCourseIds = new Set(issued.map((c) => c.course.id));

  // ------------------------------------------------------------------
  // 2) PENDING CERTIFICATES
  //    Passed exam, no cert row yet, course has certificate_enabled.
  // ------------------------------------------------------------------
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(
      `course:courses ( id, title, slug, icon, color, certificate_enabled )`
    )
    .eq("user_id", user.id);

  const enrolledCourses = (enrollments ?? [])
    .map((e) => {
      const c = Array.isArray(e.course) ? e.course[0] : e.course;
      return c ?? null;
    })
    .filter(Boolean) as Array<{
    id: string;
    title: string;
    slug: string;
    icon: string | null;
    color: string | null;
    certificate_enabled: boolean;
  }>;

  const enrolledCourseIds = enrolledCourses.map((c) => c.id);

  const { data: passedAttempts } = enrolledCourseIds.length
    ? await supabase
        .from("exam_attempts")
        .select("course_id, score, passed, completed_at")
        .eq("user_id", user.id)
        .eq("passed", true)
    : { data: [] as any[] };

  const passedMap = new Map(
    (passedAttempts ?? []).map((a) => [a.course_id, a])
  );

  const pending = enrolledCourses
    .filter((c) => {
      if (issuedCourseIds.has(c.id)) return false;
      if (!c.certificate_enabled) return false;
      return passedMap.has(c.id);
    })
    .map((c) => ({
      ...c,
      score: passedMap.get(c.id)?.score ?? 0,
      completedAt: passedMap.get(c.id)?.completed_at ?? null,
    }));

  return (
    <>
      <Navbar />

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 sm:px-8 sm:py-14 animate-fade-up">
        <Link
          href="/dashboard"
          className="text-sm font-bold text-blue-700 transition hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
        >
          ← Back to dashboard
        </Link>

        <header className="mt-4">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-[#f1f5f9]">
            Your certificates
          </h1>
          <p className="mt-2 text-slate-600 dark:text-[#94a3b8]">
            Verified certificates for completed courses.
          </p>
        </header>

        {/* EMPTY STATE */}
        {issued.length === 0 && pending.length === 0 && (
          <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center dark:border-[#1f2a44] dark:bg-[#10182b]">
            <p className="text-4xl">🏆</p>
            <p className="mt-3 font-bold text-slate-900 dark:text-[#f1f5f9]">
              No certificates yet.
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-[#94a3b8]">
              Complete a course to earn your first certificate.
            </p>
            <Link
              href="/courses"
              className="mt-5 inline-flex rounded-full bg-blue-700 px-6 py-3 font-bold text-white shadow-lg shadow-blue-700/20 transition hover:-translate-y-0.5 hover:bg-blue-800 dark:bg-blue-600"
            >
              Browse courses →
            </Link>
          </div>
        )}

        {/* ======================= ISSUED ======================= */}
        {issued.length > 0 && (
          <section className="mt-10">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-[#f1f5f9]">
                  Earned
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-[#94a3b8]">
                  {issued.length}{" "}
                  {issued.length === 1 ? "certificate" : "certificates"} —
                  shareable and verifiable
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {issued.map((c) => {
                // A cert is LOCKED only when:
                //  - certificate feature is globally enabled
                //  - payment is globally required
                //  - the cert has not been paid for
                //
                // If admin disables "require payment" → all certs unlock.
                // If admin disables certificates entirely → treat as unlocked
                //   (their existing cert remains viewable, no new ones issued).
                const locked =
                  certEnabled &&
                  requirePayment &&
                  !c.is_paid &&
                  !c.paid_at;

                return (
                  <div
                    key={c.id}
                    className={`rounded-2xl border p-6 transition hover:-translate-y-0.5 hover:shadow-xl ${
                      locked
                        ? "border-amber-200 bg-amber-50/50 hover:border-amber-300 hover:shadow-amber-900/5 dark:border-amber-900/50 dark:bg-amber-950/20"
                        : "border-slate-200 bg-white hover:border-blue-200 hover:shadow-blue-900/5 dark:border-[#1f2a44] dark:bg-[#131c33] dark:hover:border-blue-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className={`flex h-12 w-12 items-center justify-center rounded-xl text-lg font-black ${
                          c.course.color ?? "bg-blue-100 text-blue-700"
                        } dark:bg-[#1b2742] dark:text-blue-300`}
                      >
                        {c.course.icon ?? "🏆"}
                      </span>

                      {locked ? (
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                          🔒 Locked
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          ✓ Verified
                        </span>
                      )}
                    </div>

                    <h3 className="mt-4 text-lg font-extrabold text-slate-900 dark:text-[#f1f5f9]">
                      {c.course.title}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500 dark:text-[#94a3b8]">
                      Issued{" "}
                      {new Date(c.issued_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>

                    <p className="mt-3 truncate font-mono text-xs text-slate-500 dark:text-[#94a3b8]">
                      Code: {c.verification_code}
                    </p>

                    {locked ? (
                      <>
                        <p className="mt-4 text-sm text-slate-600 dark:text-[#94a3b8]">
                          Pay the certificate fee to unlock your verified
                          certificate.
                        </p>
                        <Link
                          href={`/courses/${c.course.slug}/certificate`}
                          className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-amber-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-amber-600/20 transition hover:bg-amber-700"
                        >
                          Unlock certificate →
                        </Link>
                      </>
                    ) : (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          href={`/verify/${c.verification_code}`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-700/20 transition hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                        >
                          🏆 View certificate
                        </Link>
                        <Link
                          href={`/courses/${c.course.slug}/certificate`}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1] dark:hover:bg-[#1b2742]"
                        >
                          Course page
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ======================= PENDING ======================= */}
        {pending.length > 0 && (
          <section className="mt-10">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-[#f1f5f9]">
                  Pending
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-[#94a3b8]">
                  You passed — certificate being issued
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {pending.map((c) => (
                <div
                  key={c.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 dark:border-[#1f2a44] dark:bg-[#131c33] dark:hover:border-blue-700"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-xl text-lg font-black ${
                        c.color ?? "bg-blue-100 text-blue-700"
                      } dark:bg-[#1b2742] dark:text-blue-300`}
                    >
                      {c.icon ?? "📘"}
                    </span>
                    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-black uppercase text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                      ⏳ Pending
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-extrabold text-slate-900 dark:text-[#f1f5f9]">
                    {c.title}
                  </h3>

                  <p className="mt-1 text-xs text-slate-500 dark:text-[#94a3b8]">
                    Passed with {c.score}%
                    {c.completedAt
                      ? ` on ${new Date(c.completedAt).toLocaleDateString()}`
                      : ""}
                  </p>

                  <p className="mt-3 text-sm text-slate-600 dark:text-[#94a3b8]">
                    Your certificate is being issued. Check back in a few
                    minutes, or visit the course page to see its status.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/courses/${c.slug}/certificate`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-700/20 transition hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                    >
                      View status →
                    </Link>
                    <Link
                      href={`/courses/${c.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1] dark:hover:bg-[#1b2742]"
                    >
                      Review course
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}