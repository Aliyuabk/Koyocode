import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Playground from "@/components/Playground";
import { createClient } from "@/lib/supabase/server";

export default async function PlaygroundPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/playground");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, role")
    .eq("id", user.id)
    .single();

  return (
    <>
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
              Playground
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-[#f1f5f9]">
              Code editor
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-[#94a3b8]">
              Write, run, and share code right in your browser. No setup needed.
            </p>
          </div>

          <Link
            href="/courses"
            className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1]"
          >
            ← Back to courses
          </Link>
        </div>

        <Playground
          userId={user.id}
          userName={profile?.full_name ?? user.email ?? "Student"}
        />
      </main>

      <Footer />
    </>
  );
}