import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-slate-950 px-5 py-12 text-white sm:px-8 dark:bg-[#060a14]">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-xl font-black">
                K
              </span>
              <span className="text-xl font-extrabold">KoyoCode</span>
            </Link>
            <p className="mt-4 max-w-sm leading-7 text-slate-400">
              Making the first steps into programming simpler, one lesson at a
              time.
            </p>
            <p className="mt-3 text-sm font-medium text-blue-300">
              Koyi coding. Gina makomarka.
            </p>
          </div>

          <div>
            <h3 className="font-bold">Explore</h3>
            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-400">
              <Link className="hover:text-white" href="/courses">
                Courses
              </Link>
              <Link className="hover:text-white" href="/#how-it-works">
                How it works
              </Link>
              <Link className="hover:text-white" href="/#about">
                About us
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-bold">Help</h3>
            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-400">
              <Link className="hover:text-white" href="/#faq">
                FAQs
              </Link>
              <Link className="hover:text-white" href="/courses">
                Learning paths
              </Link>
              <Link className="hover:text-white" href="/#home">
                Back to top ↑
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col justify-between gap-3 border-t border-white/10 pt-6 text-sm text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} KoyoCode. All rights reserved.</p>
          <p>Built for curious minds and future creators.</p>
        </div>
      </div>
    </footer>
  );
}