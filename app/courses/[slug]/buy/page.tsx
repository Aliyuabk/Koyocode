import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BuyButton from "@/components/BuyButton";
import { createClient } from "@/lib/supabase/server";
import { getCourseBySlug } from "@/lib/queries";
import { getPublicSettings, koboToNaira } from "@/lib/settings";

export default async function BuyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/courses/${slug}/buy`);

  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  if (!course.is_premium) redirect(`/courses/${slug}`);

  const settings = await getPublicSettings();

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id, paid_at")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .maybeSingle();

  if (enrollment?.paid_at) redirect(`/courses/${slug}`);

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-16 sm:px-8">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-800 dark:bg-amber-950/30">
          <span className="text-4xl">{course.icon ?? "📘"}</span>
          <h1 className="mt-3 text-2xl font-black text-slate-900 dark:text-[#f1f5f9]">
            {course.title}
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-[#94a3b8]">
            {course.description}
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-[#1f2a44] dark:bg-[#131c33]">
          <p className="text-xs font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-400">
            Unlock full access
          </p>

          <p className="mt-3 text-3xl font-black text-slate-900 dark:text-[#f1f5f9]">
            {koboToNaira(course.price_kobo, settings.currency)}
          </p>

          <p className="mt-1 text-sm text-slate-600 dark:text-[#94a3b8]">
            One-time payment · Lifetime access
          </p>

          <ul className="mt-5 space-y-2 text-sm text-slate-600 dark:text-[#94a3b8]">
            <li className="flex items-center gap-2">
              <span className="text-emerald-500">✓</span>
              All {course.lessons_count} lessons unlocked
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-500">✓</span>
              Take the final exam
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-500">✓</span>
              Certificate eligibility
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-500">✓</span>
              Access from any device, forever
            </li>
          </ul>

          <div className="mt-6">
            <BuyButton
              type="course"
              courseId={course.id}
              label={`Pay ${koboToNaira(course.price_kobo, settings.currency)}`}
            />
          </div>

          <p className="mt-3 text-center text-xs text-slate-500 dark:text-[#94a3b8]">
            Card · Opay · Kuda · USSD · Bank transfer
          </p>
        </div>

        <Link
          href={`/courses/${slug}`}
          className="mt-6 block text-center text-sm font-bold text-blue-700 hover:text-blue-900 dark:text-blue-400"
        >
          ← Back to course
        </Link>
      </main>
      <Footer />
    </>
  );
}