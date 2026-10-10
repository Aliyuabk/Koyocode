import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Preloader from "@/components/Preloader";
import ThemeProvider from "@/components/ThemeProvider";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KoyoCode — Koyi Coding cikin Hausa da Turanci",
  description:
    "Free beginner coding lessons in Hausa and English. Learn HTML, CSS, JavaScript and Python step by step.",
};

const themeInitScript = `
(function() {
  try {
    var mode = localStorage.getItem('theme-mode') || 'system';
    var accent = localStorage.getItem('theme-accent') || 'blue';
    var resolved = mode === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : mode;
    var root = document.documentElement;
    root.classList.toggle('dark', resolved === 'dark');
    root.dataset.accent = accent;
    root.style.colorScheme = resolved;
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col bg-white text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
        <ThemeProvider>
          <Preloader />
          {children}
        </ThemeProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}