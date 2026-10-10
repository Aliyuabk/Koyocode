import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-5 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-700 text-2xl font-black text-white shadow-lg shadow-blue-700/20">
        K
      </span>

      <p className="mt-8 text-sm font-extrabold uppercase tracking-[0.18em] text-blue-700">
        404 — Not found
      </p>

      <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
        This page doesn&apos;t exist.
      </h1>

      <p className="mt-4 max-w-md leading-7 text-slate-600">
        The lesson or page you&apos;re looking for may have moved, or the link
        might be wrong. Let&apos;s get you back on track.
      </p>

      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full bg-blue-700 px-7 py-3.5 font-bold text-white transition hover:bg-blue-800"
        >
          Back home →
        </Link>
        <Link
          href="/#courses"
          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-7 py-3.5 font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50"
        >
          Browse courses
        </Link>
      </div>
    </div>
  );
}