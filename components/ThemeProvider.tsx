"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { createClient } from "@/lib/supabase/client";

export type ThemeMode = "light" | "dark" | "system";
export type Accent = "blue" | "emerald" | "purple" | "rose" | "amber";

type ThemeContextType = {
  mode: ThemeMode;
  accent: Accent;
  resolvedMode: "light" | "dark";
  setMode: (m: ThemeMode) => void;
  setAccent: (a: Accent) => void;
  /** Persist to Supabase profile (only for logged-in users) */
  persistToProfile: (m: ThemeMode, a: Accent) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}

function resolveMode(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return mode;
}

function applyTheme(mode: ThemeMode, accent: Accent) {
  const root = document.documentElement;
  const resolved = resolveMode(mode);
  root.classList.toggle("dark", resolved === "dark");
  root.dataset.accent = accent;
  root.style.colorScheme = resolved;
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [accent, setAccentState] = useState<Accent>("blue");
  const [resolvedMode, setResolvedMode] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount, then sync from profile if logged in
  useEffect(() => {
    const localMode = (localStorage.getItem("theme-mode") as ThemeMode) ?? "system";
    const localAccent = (localStorage.getItem("theme-accent") as Accent) ?? "blue";

    setModeState(localMode);
    setAccentState(localAccent);
    setMounted(true);

    // Try to sync from Supabase profile
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("theme_mode, theme_accent")
        .eq("id", data.user.id)
        .single();

      if (profile?.theme_mode) {
        setModeState(profile.theme_mode as ThemeMode);
      }
      if (profile?.theme_accent) {
        setAccentState(profile.theme_accent as Accent);
      }
    });
  }, []);

  // Apply changes
  useEffect(() => {
    if (!mounted) return;
    const resolved = resolveMode(mode);
    setResolvedMode(resolved);
    applyTheme(mode, accent);
    localStorage.setItem("theme-mode", mode);
    localStorage.setItem("theme-accent", accent);
  }, [mode, accent, mounted]);

  // Follow OS changes when in "system"
  useEffect(() => {
    if (!mounted || mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system", accent);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode, accent, mounted]);

  const persistToProfile = useCallback(
    async (m: ThemeMode, a: Accent) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from("profiles")
        .update({ theme_mode: m, theme_accent: a })
        .eq("id", user.id);
    },
    []
  );

  const setMode = useCallback(
    (m: ThemeMode) => {
      setModeState(m);
      persistToProfile(m, accent);
    },
    [accent, persistToProfile]
  );

  const setAccent = useCallback(
    (a: Accent) => {
      setAccentState(a);
      persistToProfile(mode, a);
    },
    [mode, persistToProfile]
  );

  return (
    <ThemeContext.Provider
      value={{ mode, accent, resolvedMode, setMode, setAccent, persistToProfile }}
    >
      {children}
    </ThemeContext.Provider>
  );
}