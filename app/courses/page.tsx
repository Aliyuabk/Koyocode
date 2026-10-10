import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CourseCard from "@/components/CourseCard";
import { getCourses } from "@/lib/queries";

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";

  const all = await getCourses();
  const courses = query
    ? all.filter(
        (c) =>
          c.title.toLowerCase().includes(query.toLowerCase()) ||
          (c.description ?? "").toLowerCase().includes(query.toLowerCase()) ||
          c.category.toLowerCase().includes(query.toLowerCase())
      )
    : all;

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

        {courses.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center dark:border-[#1f2a44] dark:bg-[#10182b]">
            <p className="text-4xl">🔍</p>
            <p className="mt-3 font-bold text-slate-900 dark:text-[#f1f5f9]">
              {query ? "No courses match your search." : "No courses yet."}
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-[#94a3b8]">
              {query ? "Try a different keyword." : "New lessons are coming soon."}
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
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}