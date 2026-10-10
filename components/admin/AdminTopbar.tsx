"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ThemeSwitcher from "@/components/ThemeSwitcher";

const titles: Record<string, string> = {
  "/admin": "Overview",
  "/admin/courses": "Courses",
  "/admin/lessons": "Lessons",
  "/admin/users": "Users",
  "/admin/enrollments": "Enrollments",
  "/admin/exams": "Exams",
  "/admin/certificates": "Certificates",
  "/admin/activity": "Activity log",
};

export default function AdminTopbar({
  userName,
  userEmail,
  userAvatar,
}: {
  userName: string;
  userEmail: string;
  userAvatar: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const title = titles[pathname] ?? "Admin";

  return (
    <header className="sticky top-0 z-30 border-b border-[#1f2a44] bg-[#0a0e1a] text-white">
      <div className="flex items-center justify-between gap-4 px-6 py-3.5 lg:px-10">
        {/* LEFT */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#1f2a44] text-lg lg:hidden"
            aria-label="Menu"
          >
            {mobileMenu ? "✕" : "☰"}
          </button>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400">
              Admin
            </p>
            <h1 className="text-lg font-black">{title}</h1>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3">
          <span className="hidden rounded-full bg-purple-500/20 px-3 py-1.5 text-xs font-bold text-purple-300 sm:inline">
            🛠️ Admin mode
          </span>

          <ThemeSwitcher />

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setOpen((s) => !s)}
              className="flex items-center gap-2 rounded-full border border-[#1f2a44] bg-[#0e1526] p-1 pr-3 transition hover:bg-[#1b2742]"
            >
              <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-600 to-purple-800 text-xs font-black">
                {userAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={userAvatar} alt={userName} className="h-full w-full object-cover" />
                ) : (
                  userName
                    .split(" ")
                    .map((s) => s[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                )}
              </span>
              <span className="hidden max-w-[140px] truncate text-sm font-bold sm:inline">
                {userName.split(" ")[0]}
              </span>
              <svg
                className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-64 origin-top-right overflow-hidden rounded-xl border border-[#1f2a44] bg-[#131c33] shadow-2xl animate-slide-down">
                <div className="border-b border-[#1f2a44] px-4 py-4">
                  <p className="truncate text-sm font-bold">{userName}</p>
                  <p className="mt-0.5 truncate text-xs text-[#94a3b8]">{userEmail}</p>
                </div>

                <div className="py-2">
                  <Link
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#cbd5e1] transition hover:bg-[#1b2742] hover:text-white"
                  >
                    <span className="text-base">👤</span> Switch to student view
                  </Link>
                  <Link
                    href="/"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#cbd5e1] transition hover:bg-[#1b2742] hover:text-white"
                  >
                    <span className="text-base">🌐</span> Public site
                  </Link>
                </div>

                <div className="border-t border-[#1f2a44] py-2">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-red-400 transition hover:bg-red-950/40"
                  >
                    <span className="text-base">↩</span> Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE NAV */}
      {mobileMenu && (
        <nav className="border-t border-[#1f2a44] bg-[#0e1526] px-4 py-3 lg:hidden">
          {[
            { href: "/admin", label: "Overview", icon: "📊" },
            { href: "/admin/courses", label: "Courses", icon: "📚" },
            { href: "/admin/lessons", label: "Lessons", icon: "🎬" },
            { href: "/admin/users", label: "Users", icon: "👥" },
            { href: "/admin/enrollments", label: "Enrollments", icon: "✍️" },
            { href: "/admin/exams", label: "Exams", icon: "🎯" },
            { href: "/admin/certificates", label: "Certificates", icon: "🏆" },
            { href: "/admin/activity", label: "Activity log", icon: "📜" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenu(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#cbd5e1] transition hover:bg-[#1b2742] hover:text-white"
            >
              <span>{item.icon}</span> {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}