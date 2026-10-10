"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { persistProgress } from "@/lib/progress";

type Chapter = { time: number; title: string };
type Resource = { name: string; url: string };

type Question = {
  id: string;
  trigger_at: number;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
};

type Props = {
  lessonId: string;
  youtubeId: string;
  title: string;
  transcript?: string | null;
  resources?: Resource[];
  chapters?: Chapter[];
  questions?: Question[];
  initialPercent?: number;
  onComplete?: () => void;
};

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

function formatTime(sec: number) {
  if (!isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) return resolve();
    const existing = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      existing?.();
      resolve();
    };
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
  });
}

export default function ProVideoPlayer({
  lessonId,
  youtubeId,
  title,
  transcript,
  resources = [],
  chapters = [],
  questions = [],
  initialPercent = 0,
  onComplete,
}: Props) {
  const containerId = `ytp-${lessonId.replace(/-/g, "")}`;
  const playerRef = useRef<any>(null);
  const tickRef = useRef<number | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const controlsTimerRef = useRef<number | null>(null);

  const lastTimeRef = useRef(0);
  const maxWatchedRef = useRef(initialPercent);
  const completedRef = useRef(initialPercent >= 95);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [muted, setMuted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [percent, setPercent] = useState(initialPercent);
  const [completed, setCompleted] = useState(initialPercent >= 95);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [tab, setTab] = useState<"transcript" | "notes" | "files" | null>("transcript");
  const [showControls, setShowControls] = useState(true);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const scheduleSave = useCallback(
    (pct: number, isDone: boolean) => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(() => {
        persistProgress(lessonId, pct, isDone);
      }, 1500);
    },
    [lessonId]
  );

  // Init player
  useEffect(() => {
    let cancelled = false;

    loadYouTubeAPI().then(() => {
      if (cancelled || playerRef.current) return;

      playerRef.current = new window.YT.Player(containerId, {
        videoId: youtubeId,
        playerVars: {
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          fs: 0,
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (e: any) => {
            setReady(true);
            const d = e.target.getDuration?.() ?? 0;
            setDuration(d);

            if (initialPercent > 0 && initialPercent < 95 && d > 0) {
              const t = (initialPercent / 100) * d;
              e.target.seekTo(t, true);
              lastTimeRef.current = t;
            }
          },
          onStateChange: (e: any) => {
            const s = e.data;
            // -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
            if (s === 1) {
              setPlaying(true);
              setBuffering(false);
              startTicker();
            } else if (s === 2) {
              setPlaying(false);
              stopTicker();
            } else if (s === 3) {
              setBuffering(true);
            } else if (s === 0) {
              setPlaying(false);
              stopTicker();
              if (!completedRef.current) {
                completedRef.current = true;
                setCompleted(true);
                setPercent(100);
                maxWatchedRef.current = 100;
                persistProgress(lessonId, 100, true);
                onComplete?.();
              }
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      stopTicker();
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      if (controlsTimerRef.current) window.clearTimeout(controlsTimerRef.current);
      try {
        playerRef.current?.destroy?.();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [youtubeId]);

  function startTicker() {
    stopTicker();
    tickRef.current = window.setInterval(() => {
      const p = playerRef.current;
      if (!p || typeof p.getCurrentTime !== "function") return;

      const cur = p.getCurrentTime();
      const dur = p.getDuration?.() ?? 0;
      if (!dur) return;

      // SEEK FORWARD BLOCK
      if (cur > lastTimeRef.current + 2.5) {
        p.seekTo(lastTimeRef.current, true);
        return;
      }
      lastTimeRef.current = cur;

      setCurrent(cur);
      setDuration(dur);

      const pct = Math.min(100, Math.round((cur / dur) * 100));
      if (pct > maxWatchedRef.current) {
        maxWatchedRef.current = pct;
        setPercent(pct);
        scheduleSave(pct, pct >= 95);
      }

      if (pct >= 95 && !completedRef.current) {
        completedRef.current = true;
        setCompleted(true);
        persistProgress(lessonId, pct, true);
        onComplete?.();
      }

      // Trigger popup question
      if (questions.length > 0 && !activeQuestion) {
        const next = questions.find(
          (q) =>
            !answeredQuestions.has(q.id) &&
            cur >= q.trigger_at &&
            cur < q.trigger_at + 1.5
        );
        if (next) {
          p.pauseVideo();
          setActiveQuestion(next);
          setSelectedOption(null);
          setShowExplanation(false);
        }
      }
    }, 1000);
  }

  function stopTicker() {
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }

  function togglePlay() {
    const p = playerRef.current;
    if (!p) return;
    const state = p.getPlayerState?.();
    if (state === 1) p.pauseVideo();
    else p.playVideo();
  }

  function skipBack(sec: number) {
    const p = playerRef.current;
    if (!p) return;
    const cur = p.getCurrentTime?.() ?? 0;
    const target = Math.max(0, cur - sec);
    p.seekTo(target, true);
    lastTimeRef.current = target;
  }

  function handleProgressClick(e: React.MouseEvent<HTMLDivElement>) {
    const p = playerRef.current;
    if (!p || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const target = ratio * duration;

    // Only allow backwards seek
    if (target <= lastTimeRef.current + 2) {
      p.seekTo(target, true);
      lastTimeRef.current = target;
    }
  }

  function toggleMute() {
    const p = playerRef.current;
    if (!p) return;
    if (muted) {
      p.unMute();
      setMuted(false);
    } else {
      p.mute();
      setMuted(true);
    }
  }

  function cycleSpeed() {
    const p = playerRef.current;
    if (!p) return;
    const speeds = [1, 1.25, 1.5, 0.75];
    const idx = speeds.indexOf(playbackRate);
    const next = speeds[(idx + 1) % speeds.length];
    p.setPlaybackRate(next);
    setPlaybackRate(next);
  }

  function toggleFullscreen() {
    const el = wrapperRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen();
  }

  function showControlsBriefly() {
    setShowControls(true);
    if (controlsTimerRef.current) window.clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = window.setTimeout(() => {
      if (playing && !activeQuestion) setShowControls(false);
    }, 2500);
  }

  function answerQuestion() {
    if (selectedOption === null || !activeQuestion) return;
    setShowExplanation(true);
    setAnsweredQuestions((s) => new Set(s).add(activeQuestion.id));
  }

  function dismissQuestion() {
    setActiveQuestion(null);
    setSelectedOption(null);
    setShowExplanation(false);
    playerRef.current?.playVideo();
  }

  const progressPercent = duration ? (current / duration) * 100 : 0;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      {/* ==================== PLAYER ==================== */}
      <div>
        <div
          ref={wrapperRef}
          onMouseMove={showControlsBriefly}
          onMouseLeave={() => playing && setShowControls(false)}
          className="group relative overflow-hidden rounded-2xl bg-black shadow-2xl shadow-blue-900/20"
        >
          {/* YOUTUBE IFRAME — sized to fill, controls hidden */}
          <div className="relative aspect-video w-full bg-black">
            <div id={containerId} className="absolute inset-0 h-full w-full" />

            {/* Transparent shield to block clicks reaching YouTube's own UI */}
            <div className="absolute inset-0" onContextMenu={(e) => e.preventDefault()} />

            {/* BUFFERING */}
            {buffering && ready && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
                <span className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />
              </div>
            )}

            {/* BIG CENTER PLAY */}
            {ready && !playing && !completed && !activeQuestion && (
              <button
                onClick={togglePlay}
                aria-label="Play"
                className="absolute inset-0 flex items-center justify-center bg-black/30 transition hover:bg-black/20"
              >
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-700 text-white shadow-2xl transition hover:scale-105 dark:bg-blue-600">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </button>
            )}

            {/* COMPLETED BADGE */}
            {completed && !playing && !activeQuestion && (
              <div className="absolute left-4 top-4 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-black text-white shadow-lg">
                ✓ Completed
              </div>
            )}

            {/* QUESTION POPUP */}
            {activeQuestion && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
                <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#131c33]">
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                    <span>❓</span> Quick check
                  </div>
                  <p className="mt-3 text-lg font-black text-slate-900 dark:text-[#f1f5f9]">
                    {activeQuestion.question}
                  </p>

                  <div className="mt-5 space-y-2">
                    {activeQuestion.options.map((opt, i) => {
                      const isSelected = selectedOption === i;
                      const isCorrect = i === activeQuestion.correct_index;
                      const showResult = showExplanation;

                      return (
                        <button
                          key={i}
                          onClick={() => !showResult && setSelectedOption(i)}
                          disabled={showResult}
                          className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left text-sm font-medium transition ${
                            showResult && isCorrect
                              ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : showResult && isSelected && !isCorrect
                              ? "border-red-500 bg-red-50 text-red-800 dark:border-red-500 dark:bg-red-950/40 dark:text-red-300"
                              : isSelected
                              ? "border-blue-500 bg-blue-50 text-blue-800 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300"
                              : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/50 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1] dark:hover:border-blue-600"
                          }`}
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white font-black dark:bg-[#1b2742]">
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="flex-1">{opt}</span>
                          {showResult && isCorrect && <span>✓</span>}
                          {showResult && isSelected && !isCorrect && <span>✕</span>}
                        </button>
                      );
                    })}
                  </div>

                  {showExplanation && activeQuestion.explanation && (
                    <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800 dark:border-[#1f2a44] dark:bg-[#10182b] dark:text-blue-300">
                      <p className="font-bold">Explanation</p>
                      <p className="mt-1">{activeQuestion.explanation}</p>
                    </div>
                  )}

                  <div className="mt-6 flex gap-3">
                    {!showExplanation ? (
                      <button
                        onClick={answerQuestion}
                        disabled={selectedOption === null}
                        className="flex-1 rounded-xl bg-blue-700 px-5 py-3 font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500"
                      >
                        Check answer
                      </button>
                    ) : (
                      <button
                        onClick={dismissQuestion}
                        className="flex-1 rounded-xl bg-blue-700 px-5 py-3 font-bold text-white transition hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                      >
                        Continue video →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* CONTROLS */}
            {ready && !activeQuestion && (
              <div
                className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-3 transition-opacity duration-300 ${
                  showControls || !playing ? "opacity-100" : "opacity-0"
                }`}
              >
                {/* PROGRESS BAR */}
                <div
                  onClick={handleProgressClick}
                  className="group/bar relative mb-3 h-1.5 cursor-pointer rounded-full bg-white/25 transition-all hover:h-2.5"
                >
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-blue-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                  {chapters.map((c, i) => (
                    <span
                      key={i}
                      title={c.title}
                      className="absolute top-1/2 h-3 w-1 -translate-y-1/2 rounded-full bg-white/80"
                      style={{ left: `${(c.time / duration) * 100}%` }}
                    />
                  ))}
                  <div
                    className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-md transition group-hover/bar:scale-125"
                    style={{ left: `${progressPercent}%` }}
                  />
                </div>

                {/* BUTTONS */}
                <div className="flex items-center gap-3 text-white">
                  <button
                    onClick={togglePlay}
                    aria-label={playing ? "Pause" : "Play"}
                    className="flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-white/10"
                  >
                    {playing ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="5" width="4" height="14" rx="1" />
                        <rect x="14" y="5" width="4" height="14" rx="1" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>

                  <button
                    onClick={() => skipBack(10)}
                    aria-label="Back 10 seconds"
                    className="flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-white/10"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12a9 9 0 1 0 3-6.7" />
                      <polyline points="3 4 3 10 9 10" />
                    </svg>
                  </button>

                  <button
                    onClick={toggleMute}
                    aria-label={muted ? "Unmute" : "Mute"}
                    className="flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-white/10"
                  >
                    {muted ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 5 6 9H2v6h4l5 4V5z" />
                        <line x1="23" y1="9" x2="17" y2="15" />
                        <line x1="17" y1="9" x2="23" y2="15" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 5 6 9H2v6h4l5 4V5z" />
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                      </svg>
                    )}
                  </button>

                  <span className="text-xs font-bold tabular-nums text-white/90">
                    {formatTime(current)} / {formatTime(duration)}
                  </span>

                  <div className="flex-1" />

                  <button
                    onClick={cycleSpeed}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-black transition hover:bg-white/10"
                  >
                    {playbackRate}×
                  </button>

                  <button
                    onClick={toggleFullscreen}
                    aria-label="Fullscreen"
                    className="flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-white/10"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
                      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
                      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* INFO BELOW PLAYER */}
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-[#f1f5f9]">
              {title}
            </h1>
            <p className="text-xs text-slate-500 dark:text-[#94a3b8]">
              Watch 95% to unlock the next lesson. Forward seek is disabled.
            </p>
          </div>
          <p className="shrink-0 text-2xl font-black text-blue-700 dark:text-blue-400">
            {percent}%
          </p>
        </div>

        {/* CHAPTERS */}
        {chapters.length > 0 && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#1f2a44] dark:bg-[#131c33]">
            <p className="text-xs font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Chapters
            </p>
            <ul className="mt-3 space-y-1">
              {chapters.map((c, i) => (
                <li key={i}>
                  <button
                    onClick={() => {
                      const p = playerRef.current;
                      if (!p) return;
                      if (c.time <= lastTimeRef.current + 2) {
                        p.seekTo(c.time, true);
                        lastTimeRef.current = c.time;
                      }
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-blue-50 dark:hover:bg-[#1b2742]"
                  >
                    <span className="font-mono text-xs text-slate-500 dark:text-[#94a3b8]">
                      {formatTime(c.time)}
                    </span>
                    <span className="text-slate-700 dark:text-[#cbd5e1]">
                      {c.title}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ==================== SIDEBAR ==================== */}
      <aside className="space-y-2">
        <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-[#1f2a44] dark:bg-[#131c33]">
          {[
            { key: "transcript", label: "Transcript", icon: "📝" },
            { key: "notes", label: "Notes", icon: "✏️" },
            { key: "files", label: "Files", icon: "📄" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() =>
                setTab(tab === (t.key as any) ? null : (t.key as any))
              }
              className={`flex flex-1 flex-col items-center gap-1 rounded-lg py-2.5 text-xs font-bold transition ${
                tab === t.key
                  ? "bg-blue-50 text-blue-700 dark:bg-[#16233d] dark:text-blue-300"
                  : "text-slate-500 hover:bg-slate-50 dark:text-[#94a3b8] dark:hover:bg-[#1b2742]"
              }`}
            >
              <span className="text-base">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "transcript" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#1f2a44] dark:bg-[#131c33]">
            <p className="text-xs font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Transcript
            </p>
            <div className="mt-3 max-h-[600px] overflow-y-auto pr-1">
              {transcript ? (
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-[#cbd5e1]">
                  {transcript}
                </p>
              ) : (
                <p className="text-sm text-slate-500 dark:text-[#94a3b8]">
                  No transcript for this lesson yet.
                </p>
              )}
            </div>
          </div>
        )}

        {tab === "notes" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#1f2a44] dark:bg-[#131c33]">
            <p className="text-xs font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Your notes
            </p>
            <textarea
              placeholder="Write your notes here..."
              className="mt-3 h-64 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#f1f5f9]"
            />
            <p className="mt-2 text-xs text-slate-500 dark:text-[#94a3b8]">
              Notes are stored in this session only.
            </p>
          </div>
        )}

        {tab === "files" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#1f2a44] dark:bg-[#131c33]">
            <p className="text-xs font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Resources
            </p>
            {resources.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500 dark:text-[#94a3b8]">
                No files attached to this lesson.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {resources.map((r, i) => (
                  <li key={i}>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 dark:border-[#1f2a44] dark:text-[#cbd5e1] dark:hover:border-blue-600 dark:hover:bg-[#1b2742]"
                    >
                      <span className="text-lg">📎</span>
                      <span className="truncate">{r.name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}