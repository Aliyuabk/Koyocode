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
  "/admin/scholarships": "Scholarships",
  "/admin/exams": "Exams",
  "/admin/certificates": "Certificates",
  "/admin/revenue": "Revenue",
  "/admin/notifications": "Notifications",
  "/admin/activity": "Activity log",
};

export default function AdminTopbar({
  userName,
  userEmail,
  userAvatar,
  onMenuClick,
}: {
  userName: string;
  userEmail: string;
  userAvatar: string;
  onMenuClick?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close user menu on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Close user menu on route change
  useEffect(() => {
    setUserMenuOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  // Longest matching path wins (so /admin/courses matches before /admin)
  const title =
    Object.entries(titles)
      .sort((a, b) => b[0].length - a[0].length)
      .find(([path]) => pathname.startsWith(path))?.[1] ?? "Admin";

  return (
    <header className="sticky top-0 z-30 border-b border-[#1f2a44] bg-[#0a0e1a] text-white">
      <div className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-10">
        {/* LEFT */}
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          {/* Hamburger — opens the mobile drawer */}
          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#1f2a44] text-[#cbd5e1] transition hover:bg-[#1b2742] hover:text-white lg:hidden"
            aria-label="Open menu"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400">
              Admin
            </p>
            <h1 className="truncate text-base font-black sm:text-lg">
              {title}
            </h1>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <span className="hidden rounded-full bg-purple-500/20 px-3 py-1.5 text-xs font-bold text-purple-300 md:inline">
            🛠️ Admin mode
          </span>

          <ThemeSwitcher />

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen((s) => !s)}
              aria-expanded={userMenuOpen}
              className="flex items-center gap-2 rounded-full border border-[#1f2a44] bg-[#0e1526] p-1 pr-2 transition hover:bg-[#1b2742] sm:pr-3"
            >
              <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-600 to-purple-800 text-xs font-black">
                {userAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="h-full w-full object-cover"
                  />
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
                className={`hidden h-3 w-3 transition-transform sm:block ${
                  userMenuOpen ? "rotate-180" : ""
                }`}
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

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 origin-top-right overflow-hidden rounded-xl border border-[#1f2a44] bg-[#131c33] shadow-2xl animate-slide-down">
                <div className="border-b border-[#1f2a44] px-4 py-4">
                  <p className="truncate text-sm font-bold">{userName}</p>
                  <p className="mt-0.5 truncate text-xs text-[#94a3b8]">
                    {userEmail}
                  </p>
                </div>

                <div className="py-2">
                  <Link
                    href="/dashboard"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#cbd5e1] transition hover:bg-[#1b2742] hover:text-white"
                  >
                    <span className="text-base">👤</span> Switch to student view
                  </Link>
                  <Link
                    href="/"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#cbd5e1] transition hover:bg-[#1b2742] hover:text-white"
                  >
                    <span className="text-base">🌐</span> Public site
                  </Link>
                </div>

                <div className="border-t border-[#1f2a44] py-2">
                  <button
                    type="button"
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
    </header>
  );
}