import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";

export default async function CertificatesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: certs } = await supabase
    .from("certificates")
    .select(`id, verification_code, issued_at, course:courses ( title, icon, color )`)
    .eq("user_id", user.id)
    .order("issued_at", { ascending: false });

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-14 sm:px-8 animate-fade-up">
        <Link href="/dashboard" className="text-sm font-bold text-blue-700 hover:text-blue-900">
          ← Back to dashboard
        </Link>
        <h1 className="mt-4 text-3xl font-black tracking-tight">Your certificates</h1>
        <p className="mt-2 text-slate-600">
          Verified certificates for completed courses.
        </p>

        {(!certs || certs.length === 0) && (
          <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center">
            <p className="text-4xl">🏆</p>
            <p className="mt-3 font-bold">No certificates yet.</p>
            <p className="mt-2 text-sm text-slate-600">
              Complete a course to earn your first certificate.
            </p>
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {(certs ?? []).map((c) => {
            const course = Array.isArray(c.course) ? c.course[0] : c.course;
            return (
              <div
                key={c.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:shadow-xl hover:shadow-blue-900/5"
              >
                <span className={`flex h-12 w-12 items-center justify-center rounded-xl text-lg font-black ${course?.color ?? "bg-blue-100 text-blue-700"}`}>
                  {course?.icon ?? "🏆"}
                </span>
                <h3 className="mt-4 text-lg font-extrabold">
                  {course?.title ?? "Course"}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Issued {new Date(c.issued_at).toLocaleDateString("en-GB")}
                </p>
                <p className="mt-3 font-mono text-xs text-slate-500">
                  Code: {c.verification_code.slice(0, 8)}…
                </p>
                <Link
                  href={`/verify/${c.verification_code}`}
                  className="mt-4 inline-flex font-bold text-blue-700 hover:text-blue-900"
                >
                  View certificate →
                </Link>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}