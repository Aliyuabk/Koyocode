import Link from "next/link";

const columns = [
  {
    title: "Learn",
    links: [
      { label: "All courses", href: "/courses" },
      { label: "HTML Fundamentals", href: "/courses/html-fundamentals" },
      { label: "CSS & Web Design", href: "/courses/css-web-design" },
      { label: "Scholarship", href: "/scholarship" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/#about" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "Contact", href: "mailto:aliyuabubakar11117@gmail.com" },
      { label: "FAQs", href: "/#faq" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Verify a certificate", href: "/verify" },
    ],
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/5 bg-slate-950 text-white dark:bg-[#060a14]">
      <div className="mx-auto max-w-7xl px-5 pt-14 pb-24 sm:px-8 sm:pb-14">
        {/* TOP — brand + columns */}
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* BRAND */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2.5"
              aria-label="KoyoCode home"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-xl font-black text-white shadow-lg shadow-blue-600/30">
                K
              </span>
              <span className="text-xl font-extrabold tracking-tight">
                Koyo<span className="text-blue-400">Code</span>
              </span>
            </Link>

            <p className="mt-5 max-w-sm leading-7 text-slate-400">
              Making the first steps into programming simpler for Arewa youth —
              one lesson at a time.
            </p>

            <p className="mt-4 text-sm font-bold text-blue-400">
              Koyi coding. Gina makomarka.
            </p>

            <div className="mt-6 flex gap-3">
              <a
                href="https://www.youtube.com/@aliyudev"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-slate-300 transition hover:bg-red-600 hover:text-white"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-5.8 31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" />
                </svg>
              </a>

              <a
                href="mailto:aliyuabubakar11117@gmail.com"
                aria-label="Email"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-slate-300 transition hover:bg-blue-600 hover:text-white"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="4" width="20" height="16" rx="3" />
                  <path d="m3 7 9 6 9-6" />
                </svg>
              </a>
            </div>
          </div>

          {/* LINK COLUMNS */}
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-200">
                {col.title}
              </h3>
              <ul className="mt-5 space-y-3 text-sm">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-slate-400 transition hover:text-white"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* BOTTOM BAR */}
        <div className="mt-14 flex flex-col justify-between gap-4 border-t border-white/10 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center">
          <p>© {year} KoyoCode · New Generation Tech Academy</p>
          <p className="text-slate-500">
            Built with care for curious minds.
          </p>
        </div>
      </div>
    </footer>
  );
}