import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdSlotAdsterra from "@/components/AdSlotAdsterra";
import ScholarshipForm from "@/components/ScholarshipForm";
import { createClient } from "@/lib/supabase/server";
import { getPublicSettings } from "@/lib/settings";

export default async function ScholarshipPage() {
  const settings = await getPublicSettings();
  const supabase = await createClient();

  const adsOn = settings.ads_enabled;
  const slots = settings.ads_slots ?? {};

  // Load published courses so applicants can pick one
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, icon, is_premium, price_kobo")
    .eq("is_published", true)
    .order("sort_order");

  // Count approved so far
  const { count: approvedCount } = await supabase
    .from("scholarship_applications")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved");

  const seatsRemaining = Math.max(
    0,
    settings.scholarship_max_seats - (approvedCount ?? 0)
  );

  // If scholarship program is off, show a notice
  if (!settings.scholarship_enabled) {
    return (
      <>
        <Navbar />
        <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-20 text-center sm:px-8">
          <p className="text-5xl">🎓</p>
          <h1 className="mt-4 text-3xl font-black dark:text-[#f1f5f9]">
            Scholarship applications are closed
          </h1>
          <p className="mt-3 text-slate-600 dark:text-[#94a3b8]">
            Our next intake opens soon. Follow us on{" "}
            <a
              href="https://www.youtube.com/@aliyudev"
              className="font-bold text-blue-700 dark:text-blue-400"
              target="_blank"
              rel="noopener noreferrer"
            >
              YouTube
            </a>{" "}
            for updates.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-full bg-blue-700 px-6 py-3 font-bold text-white dark:bg-blue-600"
          >
            Back home →
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      {/* AD: TOP OF REGISTRATION PAGE */}
      {adsOn && slots.homepage_top && (
        <section className="border-b border-slate-100 bg-slate-50/60 dark:border-[#1f2a44] dark:bg-[#0e1526]/60">
          <div className="mx-auto flex max-w-5xl justify-center px-5 py-6 sm:px-8">
            <AdSlotAdsterra slot="728x90" />
          </div>
        </section>
      )}

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 sm:px-8 sm:py-16">
        {/* HEADER */}
        <div className="text-center animate-fade-up">
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
            Scholarship
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl dark:text-[#f1f5f9]">
            {settings.scholarship_title}
          </h1>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-600 dark:text-[#94a3b8]">
            {settings.scholarship_description}
          </p>
        </div>

        {/* SEATS LEFT */}
        <div className="mt-6 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            {seatsRemaining > 0
              ? `${seatsRemaining} of ${settings.scholarship_max_seats} seats remaining`
              : "All seats filled — join the waitlist"}
          </div>
        </div>

        {/* WHAT YOU GET */}
        <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-6 dark:border-[#1f2a44] dark:bg-[#10182b]">
          <p className="text-xs font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-400">
            What you get
          </p>
          <ul className="mt-4 grid gap-2 text-sm text-slate-700 dark:text-[#cbd5e1] sm:grid-cols-2">
            <li className="flex items-start gap-2">
              <span className="text-emerald-500">✓</span>
              Full access to one premium course
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500">✓</span>
              Free verified certificate on completion
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500">✓</span>
              Live Q&amp;A sessions on WhatsApp
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500">✓</span>
              Priority support from instructors
            </li>
          </ul>
        </div>

        {/* FORM */}
        <div className="mt-8 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <ScholarshipForm courses={courses ?? []} />
        </div>
      </main>

      <Footer />
    </>
  );
}