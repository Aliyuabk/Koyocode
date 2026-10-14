"use client";

import { useState, useEffect, useRef } from "react";
import type { LessonConcept } from "@/lib/types";

type VoiceLang = "en" | "ha";

/* ============================================================
   FIND BEST VOICE FOR A LANGUAGE
   ============================================================ */
function pickVoice(
  voices: SpeechSynthesisVoice[],
  lang: VoiceLang
): { voice: SpeechSynthesisVoice | null; usedFallback: boolean } {
  if (lang === "ha") {
    // Best → good → any Hausa → English fallback
    const haExact = voices.find((v) =>
      ["ha", "ha-ng", "ha-za", "ha-gh"].some((x) =>
        v.lang.toLowerCase().startsWith(x)
      )
    );
    if (haExact) return { voice: haExact, usedFallback: false };

    // Some browsers expose Hausa under a different code — check name too
    const haByName = voices.find((v) =>
      /hausa/i.test(v.name)
    );
    if (haByName) return { voice: haByName, usedFallback: false };

    // Fall back to English
    const enFallback =
      voices.find((v) => v.lang.toLowerCase().startsWith("en-ng")) ??
      voices.find((v) => v.lang.toLowerCase().startsWith("en-gb")) ??
      voices.find((v) => v.lang.toLowerCase().startsWith("en")) ??
      voices[0] ??
      null;
    return { voice: enFallback, usedFallback: !!enFallback };
  }

  // English
  const en =
    voices.find((v) => v.lang.toLowerCase().startsWith("en-ng")) ??
    voices.find((v) => v.lang.toLowerCase().startsWith("en-gb")) ??
    voices.find((v) => v.lang.toLowerCase().startsWith("en-us")) ??
    voices.find((v) => v.lang.toLowerCase().startsWith("en")) ??
    voices[0] ??
    null;
  return { voice: en, usedFallback: false };
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function LessonConcepts({
  concepts,
  onAllRead,
}: {
  concepts: LessonConcept[];
  onAllRead?: () => void;
}) {
  const [read, setRead] = useState<Set<number>>(new Set());
  const [voiceLang, setVoiceLang] = useState<VoiceLang>("en");
  const containerRef = useRef<HTMLDivElement>(null);

  // Load saved preference
  useEffect(() => {
    const saved = localStorage.getItem(
      "koyocode-voice-lang"
    ) as VoiceLang | null;
    if (saved === "en" || saved === "ha") setVoiceLang(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("koyocode-voice-lang", voiceLang);
  }, [voiceLang]);

  // Track which cards have been scrolled into view
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cards = container.querySelectorAll("[data-card-index]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(
              (entry.target as HTMLElement).dataset.cardIndex
            );
            setRead((s) => {
              if (s.has(idx)) return s;
              const next = new Set(s);
              next.add(idx);
              return next;
            });
          }
        });
      },
      { threshold: 0.5 }
    );

    cards.forEach((c) => observer.observe(c));
    return () => observer.disconnect();
  }, [concepts]);

  useEffect(() => {
    if (concepts.length > 0 && read.size === concepts.length) {
      onAllRead?.();
    }
  }, [read, concepts.length, onAllRead]);

  if (!concepts || concepts.length === 0) return null;

  return (
    <section className="space-y-4" ref={containerRef}>
      {/* HEADER + LANGUAGE TOGGLE */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-[#f1f5f9]">
          📖 Concepts
        </h2>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500 dark:text-[#94a3b8]">
            {read.size} of {concepts.length} read
          </span>

          <div
            role="group"
            aria-label="Reading language"
            className="flex gap-1 rounded-full border border-slate-200 bg-white p-1 dark:border-[#1f2a44] dark:bg-[#0e1526]"
          >
            <button
              type="button"
              onClick={() => setVoiceLang("en")}
              aria-pressed={voiceLang === "en"}
              className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                voiceLang === "en"
                  ? "bg-blue-700 text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-[#94a3b8] dark:hover:text-[#f1f5f9]"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setVoiceLang("ha")}
              aria-pressed={voiceLang === "ha"}
              className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                voiceLang === "ha"
                  ? "bg-blue-700 text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-[#94a3b8] dark:hover:text-[#f1f5f9]"
              }`}
            >
              HA
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {concepts.map((concept, idx) => (
          <ConceptCard
            key={idx}
            index={idx}
            total={concepts.length}
            concept={concept}
            voiceLang={voiceLang}
          />
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   CONCEPT CARD
   ============================================================ */
function ConceptCard({
  concept,
  index,
  total,
  voiceLang,
}: {
  concept: LessonConcept;
  index: number;
  total: number;
  voiceLang: VoiceLang;
}) {
  const [speaking, setSpeaking] = useState(false);
  const [fallbackNotice, setFallbackNotice] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Stop speech if the user switches language mid-read
  useEffect(() => {
    if (speaking && typeof window !== "undefined") {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceLang]);

  function speak() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    setFallbackNotice(false);

    const text = `${concept.title}. ${concept.body}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    const voices = window.speechSynthesis.getVoices();
    const { voice, usedFallback } = pickVoice(voices, voiceLang);

    if (voice) utterance.voice = voice;
    utterance.lang = voiceLang === "ha" ? "ha-NG" : "en-NG";
    utterance.rate = 0.95;
    utterance.pitch = 1;

    // Show fallback notice if requested language isn't available
    if (voiceLang === "ha" && usedFallback) {
      setFallbackNotice(true);
    }

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => {
      setSpeaking(false);
      setTimeout(() => setFallbackNotice(false), 2000);
    };
    utterance.onerror = () => {
      setSpeaking(false);
      setFallbackNotice(false);
    };

    window.speechSynthesis.speak(utterance);
  }

  function stop() {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      setFallbackNotice(false);
    }
  }

  return (
    <article
      data-card-index={index}
      className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-blue-200 hover:shadow-lg hover:shadow-blue-900/5 dark:border-[#1f2a44] dark:bg-[#131c33] dark:hover:border-blue-700"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-2xl dark:bg-[#16233d]">
            {concept.icon}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Concept {index + 1} of {total}
            </p>
            <h3 className="mt-1 text-lg font-black text-slate-900 dark:text-[#f1f5f9]">
              {concept.title}
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={speaking ? stop : speak}
          aria-label={
            speaking
              ? "Stop reading"
              : voiceLang === "ha"
              ? "Read aloud in Hausa"
              : "Read aloud in English"
          }
          title={
            voiceLang === "ha"
              ? "Read aloud (Hausa)"
              : "Read aloud (English)"
          }
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
            speaking
              ? "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400"
              : "bg-slate-100 text-slate-500 hover:bg-blue-100 hover:text-blue-700 dark:bg-[#1b2742] dark:text-[#94a3b8] dark:hover:text-blue-400"
          }`}
        >
          {speaking ? (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 5 6 9H2v6h4l5 4V5z" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          )}
        </button>
      </div>

      <p className="mt-4 leading-7 text-slate-700 dark:text-[#cbd5e1]">
        {concept.body}
      </p>

      {concept.code && (
        <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950 p-4 font-mono text-sm leading-7 text-slate-100">
          <code>{concept.code}</code>
        </pre>
      )}

      {/* FALLBACK NOTICE — shown briefly when Hausa is requested but not available */}
      {fallbackNotice && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          ⚠ No Hausa voice installed on this device. Reading in English
          instead.{" "}
          <details className="mt-1">
            <summary className="cursor-pointer font-bold">
              How to add Hausa voice
            </summary>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong>Android:</strong> Settings → Language & input →
                Text-to-speech → Install voice data → Hausa
              </li>
              <li>
                <strong>iOS:</strong> Settings → Accessibility → Spoken
                Content → Voices → Hausa (iOS 17+ only)
              </li>
              <li>
                <strong>Windows:</strong> Settings → Time & Language → Speech
                → Add voices → Hausa
              </li>
              <li>
                <strong>Mac:</strong> System Settings → Accessibility →
                Spoken Content → System Voice → Manage Voices
              </li>
            </ul>
          </details>
        </div>
      )}
    </article>
  );
}