"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import Avatar from "@/components/ui/Avatar";
import ThemeSwitcher from "@/components/ThemeSwitcher";

type SearchResult = {
  id: string;
  slug: string;
  title: string;
  category: string;
  icon: string | null;
  color: string | null;
};

const links = [
  { label: "Explore", href: "/courses" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "About", href: "/#about" },
  { label: "FAQs", href: "/#faq" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profileName, setProfileName] = useState("");
  const [profileAvatar, setProfileAvatar] = useState("");
  const [profileRole, setProfileRole] = useState<string>("student");
  const [scrolled, setScrolled] = useState(false);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const router = useRouter();

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Load user + profile
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user);
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url, role")
          .eq("id", data.user.id)
          .single();
        setProfileName(profile?.full_name ?? "");
        setProfileAvatar(profile?.avatar_url ?? "");
        setProfileRole(profile?.role ?? "student");
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setProfileName("");
        setProfileAvatar("");
        setProfileRole("student");
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  // Close dropdowns on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Live search (2+ chars)
  useEffect(() => {
    if (!user) return;
    const q = query.trim();

    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const t = window.setTimeout(async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, slug, title, category, icon, color")
        .eq("is_published", true)
        .or(`title.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`)
        .limit(6);

      if (!error) setResults(data ?? []);
      setSearching(false);
    }, 250);

    return () => window.clearTimeout(t);
  }, [query, user, supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    setUserMenuOpen(false);
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 2) return;
    setSearchOpen(false);
    router.push(`/courses?q=${encodeURIComponent(q)}`);
  }

  function handleResultClick() {
    setQuery("");
    setResults([]);
    setSearchOpen(false);
  }

  const firstName =
    profileName.split(" ")[0] || user?.email?.split("@")[0] || "you";

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur-md transition-all duration-300 bg-white/85 dark:bg-[#0a0e1a]/85 ${
        scrolled
          ? "border-slate-200 shadow-sm shadow-blue-900/5 dark:border-[#1f2a44]"
          : "border-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
        {/* LOGO */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 transition hover:opacity-90"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-700 text-lg font-black text-white shadow-md shadow-blue-700/25 dark:bg-blue-600">
            K
          </span>
          <span className="hidden text-lg font-extrabold tracking-tight text-slate-900 dark:text-[#f1f5f9] sm:inline">
            Koyo<span className="text-blue-600 dark:text-blue-400">Code</span>
          </span>
        </Link>

        {/* SEARCH — logged in only */}
        {user && (
          <div className="relative hidden max-w-lg flex-1 md:block" ref={searchRef}>
            <form
              onSubmit={handleSubmit}
              className="flex w-full items-center rounded-lg border border-slate-200 bg-white transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:focus-within:border-blue-500 dark:focus-within:ring-blue-950/50"
            >
              <input
                type="search"
                value={query}
                onFocus={() => setSearchOpen(true)}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSearchOpen(true);
                }}
                placeholder="Search courses (min 2 chars)..."
                className="w-full bg-transparent px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-[#f1f5f9] dark:placeholder:text-[#64748b]"
              />
              <button
                type="submit"
                aria-label="Search"
                className="mr-1 flex h-8 w-8 items-center justify-center rounded-md bg-blue-700 text-white transition hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
            </form>

            {searchOpen && query.trim().length >= 2 && (
              <div className="absolute left-0 right-0 mt-2 max-h-96 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl shadow-blue-900/10 animate-slide-down dark:border-[#1f2a44] dark:bg-[#131c33] dark:shadow-black/50">
                {searching && (
                  <div className="flex items-center gap-3 px-4 py-3 text-sm text-slate-500 dark:text-[#94a3b8]">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                    Searching…
                  </div>
                )}

                {!searching && results.length === 0 && (
                  <div className="px-4 py-6 text-center text-sm text-slate-500 dark:text-[#94a3b8]">
                    No courses match &ldquo;{query}&rdquo;.
                  </div>
                )}

                {!searching &&
                  results.map((r) => (
                    <Link
                      key={r.id}
                      href={`/courses/${r.slug}`}
                      onClick={handleResultClick}
                      className="flex items-center gap-3 border-b border-slate-50 px-4 py-3 last:border-0 transition hover:bg-blue-50 dark:border-[#1f2a44] dark:hover:bg-[#1b2742]"
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-black ${
                          r.color ?? "bg-blue-100 text-blue-700"
                        } dark:bg-[#1b2742] dark:text-blue-300`}
                      >
                        {r.icon ?? "📘"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900 dark:text-[#f1f5f9]">
                          {r.title}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-[#94a3b8]">
                          {r.category}
                        </p>
                      </div>
                      <span className="text-blue-700 dark:text-blue-400">→</span>
                    </Link>
                  ))}

                {!searching && results.length > 0 && (
                  <button
                    onClick={handleSubmit}
                    className="block w-full border-t border-slate-100 px-4 py-3 text-center text-sm font-bold text-blue-700 transition hover:bg-blue-50 dark:border-[#1f2a44] dark:text-blue-400 dark:hover:bg-[#1b2742]"
                  >
                    View all results for &ldquo;{query}&rdquo; →
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* NAV LINKS — logged out only */}
        {!user && (
          <nav className="hidden items-center gap-7 md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-slate-600 transition hover:text-blue-700 dark:text-[#cbd5e1] dark:hover:text-blue-400"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        )}

        {/* MY LEARNING — logged in only */}
        {user && (
          <Link
            href="/dashboard"
            className="hidden text-sm font-semibold text-slate-700 transition hover:text-blue-700 lg:inline dark:text-[#cbd5e1] dark:hover:text-blue-400"
          >
            My Learning
          </Link>
        )}

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-2">
          <ThemeSwitcher />

          {user ? (
            <>
              <button
                type="button"
                aria-label="Notifications"
                className="hidden h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 sm:flex dark:text-[#94a3b8] dark:hover:bg-[#1b2742] dark:hover:text-[#f1f5f9]"
              >
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
              </button>

              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((s) => !s)}
                  aria-expanded={userMenuOpen}
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 pr-3 transition hover:border-blue-200 hover:bg-blue-50 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:hover:border-blue-600 dark:hover:bg-[#1b2742]"
                >
                  <Avatar src={profileAvatar} name={profileName} email={user.email} size="sm" />
                  <svg
                    className={`h-3 w-3 text-slate-500 transition-transform dark:text-[#94a3b8] ${
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
                  <div className="absolute right-0 mt-2 w-64 origin-top-right overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-blue-900/10 animate-slide-down dark:border-[#1f2a44] dark:bg-[#131c33] dark:shadow-black/40">
                    <div className="border-b border-slate-100 px-4 py-4 dark:border-[#1f2a44]">
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-[#f1f5f9]">
                        {profileName || "Learner"}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-[#94a3b8]">
                        {user.email}
                      </p>
                    </div>

                    <div className="py-2">
                      {profileRole === "admin" && (
                        <Link
                          href="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-purple-700 transition hover:bg-purple-50 dark:text-purple-300 dark:hover:bg-purple-950/40"
                        >
                          <span className="text-base">🛠️</span> Admin panel
                        </Link>
                      )}

                      {[
                        { href: "/dashboard", icon: "📊", label: "Dashboard" },
                        { href: "/dashboard/progress", icon: "📈", label: "My progress" },
                        { href: "/dashboard/certificates", icon: "🏆", label: "Certificates" },
                        { href: "/dashboard/settings", icon: "⚙️", label: "Settings" },
                      ].map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 dark:text-[#cbd5e1] dark:hover:bg-[#1b2742] dark:hover:text-blue-400"
                        >
                          <span className="text-base">{item.icon}</span> {item.label}
                        </Link>
                      ))}
                    </div>

                    <div className="border-t border-slate-100 py-2 dark:border-[#1f2a44]">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                      >
                        <span className="text-base">↩</span> Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden text-sm font-bold text-slate-700 transition hover:text-blue-700 sm:inline dark:text-[#cbd5e1] dark:hover:text-blue-400"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white shadow-md shadow-blue-700/20 transition hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                Join for free
              </Link>
            </>
          )}

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-lg text-slate-700 transition hover:bg-slate-50 md:hidden dark:border-[#1f2a44] dark:text-[#cbd5e1] dark:hover:bg-[#1b2742]"
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {menuOpen && (
        <nav className="border-t border-slate-100 bg-white px-5 py-5 animate-slide-down md:hidden dark:border-[#1f2a44] dark:bg-[#0a0e1a]">
          {!user &&
            links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-3 py-3 font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 dark:text-[#cbd5e1] dark:hover:bg-[#1b2742] dark:hover:text-blue-400"
              >
                {l.label}
              </Link>
            ))}

          <div className="mt-4 border-t border-slate-100 pt-4 dark:border-[#1f2a44]">
            {user ? (
              <>
                <div className="mb-3 flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 dark:bg-[#16233d]">
                  <Avatar src={profileAvatar} name={profileName} email={user.email} size="md" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-[#f1f5f9]">
                      {profileName || "Learner"}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-[#94a3b8]">
                      {user.email}
                    </p>
                  </div>
                </div>

                {profileRole === "admin" && (
                  <Link
                    href="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="mb-2 block rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-center font-bold text-purple-700 transition hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300"
                  >
                    🛠️ Admin panel
                  </Link>
                )}

                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-xl bg-blue-700 px-4 py-3 text-center font-bold text-white transition hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  Dashboard →
                </Link>
                <button
                  onClick={handleLogout}
                  className="mt-2 block w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center font-bold text-red-700 transition hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-xl border border-slate-200 px-4 py-3 text-center font-bold text-slate-700 transition hover:bg-slate-50 dark:border-[#1f2a44] dark:text-[#cbd5e1] dark:hover:bg-[#1b2742]"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="mt-2 block rounded-xl bg-blue-700 px-4 py-3 text-center font-bold text-white transition hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  Join for free
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}