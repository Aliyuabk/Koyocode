import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CourseCard from "@/components/CourseCard";
import AdSlotAdsterra from "@/components/AdSlotAdsterra";
import { getCourses } from "@/lib/queries";
import { getPublicSettings } from "@/lib/settings";

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const filter = params.filter?.trim() ?? "all";

  const [all, settings] = await Promise.all([
    getCourses(),
    getPublicSettings(),
  ]);

  let courses = all;

  if (query) {
    courses = courses.filter(
      (c) =>
        c.title.toLowerCase().includes(query.toLowerCase()) ||
        (c.description ?? "").toLowerCase().includes(query.toLowerCase()) ||
        c.category.toLowerCase().includes(query.toLowerCase())
    );
  }

  if (filter === "free") courses = courses.filter((c) => !c.is_premium);
  if (filter === "premium") courses = courses.filter((c) => c.is_premium);

  const adsOn = settings.ads_enabled;
  const slots = settings.ads_slots ?? {};

  return (
    <>
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-12 sm:px-8 sm:py-16">
        <div className="animate-fade-up">
          <Link
            href="/"
            className="text-sm font-bold text-blue-700 transition hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
          >
            ← Back to home
          </Link>

          <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
            {query ? "Search results" : "All courses"}
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl dark:text-[#f1f5f9]">
            {query ? `Results for “${query}”` : "Explore our courses"}
          </h1>
          <p className="mt-4 max-w-2xl leading-7 text-slate-600 dark:text-[#94a3b8]">
            {query
              ? `${courses.length} ${courses.length === 1 ? "course" : "courses"} found.`
              : "Beginner-friendly lessons in Hausa and English."}
          </p>
        </div>

        {/* FILTER CHIPS */}
        {!query && (
          <div className="mt-6 flex flex-wrap gap-2">
            {[
              { key: "all", label: "All courses" },
              { key: "free", label: "Free only" },
              { key: "premium", label: "Premium" },
            ].map((f) => (
              <Link
                key={f.key}
                href={f.key === "all" ? "/courses" : `/courses?filter=${f.key}`}
                className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                  filter === f.key
                    ? "bg-blue-700 text-white dark:bg-blue-600"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1]"
                }`}
              >
                {f.label}
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_280px]">
          {/* MAIN GRID */}
          <div>
            {courses.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center dark:border-[#1f2a44] dark:bg-[#10182b]">
                <p className="text-4xl">🔍</p>
                <p className="mt-3 font-bold text-slate-900 dark:text-[#f1f5f9]">
                  {query ? "No courses match your search." : "No courses yet."}
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-[#94a3b8]">
                  {query
                    ? "Try a different keyword."
                    : "New lessons are coming soon."}
                </p>
                {query && (
                  <Link
                    href="/courses"
                    className="mt-5 inline-flex rounded-full bg-blue-700 px-6 py-3 font-bold text-white transition hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                  >
                    Show all courses →
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              {adsOn && slots.courses_sidebar && (
                <div className="flex justify-center">
                  <AdSlotAdsterra slot="160x600" />
                </div>
              )}

              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6 dark:border-[#1f2a44] dark:bg-[#10182b]">
                <p className="text-xs font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                  Learn in Hausa
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-[#cbd5e1]">
                  Every lesson is taught in simple Hausa and English. Start
                  free, learn at your pace, and earn a verifiable certificate.
                </p>
                <Link
                  href="/#how-it-works"
                  className="mt-4 inline-flex font-bold text-blue-700 hover:text-blue-900 dark:text-blue-400"
                >
                  How it works →
                </Link>
              </div>

              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-6 dark:border-amber-800/40 dark:bg-amber-950/20">
                <p className="text-xs font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  ⭐ Premium courses
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-[#cbd5e1]">
                  Unlock advanced lessons, real-world projects, and certificate
                  eligibility. One-time payment, lifetime access.
                </p>
                <Link
                  href="/courses?filter=premium"
                  className="mt-4 inline-flex font-bold text-amber-700 hover:text-amber-900 dark:text-amber-400"
                >
                  See premium courses →
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </>
  );
}