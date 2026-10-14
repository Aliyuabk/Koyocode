"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  youtubeId: string;
  title?: string;
  onEnded?: () => void;
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
    if (typeof window === "undefined") return;
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

export default function LessonVideo({ youtubeId, title, onEnded }: Props) {
  const containerId = `yt-lesson-${youtubeId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const playerRef = useRef<any>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const tickRef = useRef<number | null>(null);
  const controlsTimerRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [started, setStarted] = useState(false);
  const [warned, setWarned] = useState(false);

  /* ============================================================
     INIT PLAYER
     ============================================================ */
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
          },
          onStateChange: (e: any) => {
            if (e.data === 1) {
              setPlaying(true);
              setStarted(true);
              startTicker();
            } else if (e.data === 2) {
              setPlaying(false);
              stopTicker();
            } else if (e.data === 0) {
              setPlaying(false);
              stopTicker();
              onEnded?.();
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      stopTicker();
      if (controlsTimerRef.current)
        window.clearTimeout(controlsTimerRef.current);
      try {
        playerRef.current?.destroy?.();
      } catch {}
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [youtubeId]);

  /* ============================================================
     TICKER + forward-seek block
     ============================================================ */
  function startTicker() {
    stopTicker();
    tickRef.current = window.setInterval(() => {
      const p = playerRef.current;
      if (!p || typeof p.getCurrentTime !== "function") return;
      const cur = p.getCurrentTime();
      const dur = p.getDuration?.() ?? 0;

      // Block forward seek — if user jumped ahead more than 2 seconds, snap back
      if (cur > lastTimeRef.current + 2) {
        p.seekTo(lastTimeRef.current, true);
        if (!warned) {
          setWarned(true);
          window.setTimeout(() => setWarned(false), 3000);
        }
        return;
      }

      lastTimeRef.current = cur;
      if (dur) setDuration(dur);
      setCurrent(cur);
    }, 500);
  }

  function stopTicker() {
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }

  /* ============================================================
     CONTROLS
     ============================================================ */
  function togglePlay() {
    const p = playerRef.current;
    if (!p) return;
    const state = p.getPlayerState?.();
    if (state === 1) p.pauseVideo();
    else p.playVideo();
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

  function toggleFullscreen() {
    const el = wrapperRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen();
  }

  function showControlsBriefly() {
    setShowControls(true);
    if (controlsTimerRef.current)
      window.clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = window.setTimeout(() => {
      if (playing) setShowControls(false);
    }, 2500);
  }

  const progressPercent = duration ? (current / duration) * 100 : 0;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-[#f1f5f9]">
          🎬 Video
        </h2>
        <span className="text-xs font-bold text-slate-500 dark:text-[#94a3b8]">
          {duration > 0 ? formatTime(duration) : "Watch"}
        </span>
      </div>

      {/* Video wrapper — negative margins on mobile so it goes edge-to-edge */}
      <div className="-mx-5 sm:mx-0">
        <div
          ref={wrapperRef}
          onMouseMove={showControlsBriefly}
          onMouseLeave={() => playing && setShowControls(false)}
          className="group relative overflow-hidden bg-black shadow-2xl shadow-blue-900/20 sm:rounded-2xl"
        >
          <div className="relative aspect-video w-full bg-black">
            <div
              id={containerId}
              className="absolute inset-0 h-full w-full"
            />

            {/* Block clicks reaching YouTube's own UI */}
            <div
              className="absolute inset-0"
              onContextMenu={(e) => e.preventDefault()}
            />

            {/* Big center play (before first play) */}
            {ready && !playing && !started && (
              <button
                onClick={togglePlay}
                aria-label="Play video"
                className="absolute inset-0 flex items-center justify-center bg-black/30 transition hover:bg-black/20"
              >
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-700 text-white shadow-2xl transition hover:scale-105 dark:bg-blue-600">
                  <svg
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </button>
            )}

            {/* Resume overlay */}
            {ready && !playing && started && (
              <button
                onClick={togglePlay}
                aria-label="Resume video"
                className="absolute inset-0 flex items-center justify-center bg-black/40 transition hover:bg-black/30"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-blue-700 shadow-2xl transition hover:scale-105">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </button>
            )}

            {/* Seek-warning toast */}
            {warned && (
              <div className="pointer-events-none absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-full bg-red-600/95 px-4 py-2 text-xs font-bold text-white shadow-lg">
                ⚠ You cannot skip ahead. Watch the video in order.
              </div>
            )}

            {/* CONTROLS */}
            {ready && (
              <div
                className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-3 transition-opacity duration-300 ${
                  showControls || !playing ? "opacity-100" : "opacity-0"
                }`}
              >
                {/* PROGRESS BAR — display only, no click-to-seek */}
                <div className="relative mb-3 h-1.5 rounded-full bg-white/25">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-blue-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                  <div
                    className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-md"
                    style={{ left: `${progressPercent}%` }}
                  />
                </div>

                {/* BUTTON ROW */}
                <div className="flex items-center gap-3 text-white">
                  <button
                    onClick={togglePlay}
                    aria-label={playing ? "Pause" : "Play"}
                    className="flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-white/10"
                  >
                    {playing ? (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <rect x="6" y="5" width="4" height="14" rx="1" />
                        <rect x="14" y="5" width="4" height="14" rx="1" />
                      </svg>
                    ) : (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>

                  <button
                    onClick={toggleMute}
                    aria-label={muted ? "Unmute" : "Mute"}
                    className="flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-white/10"
                  >
                    {muted ? (
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
                        <path d="M11 5 6 9H2v6h4l5 4V5z" />
                        <line x1="23" y1="9" x2="17" y2="15" />
                        <line x1="17" y1="9" x2="23" y2="15" />
                      </svg>
                    ) : (
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
                    onClick={toggleFullscreen}
                    aria-label="Fullscreen"
                    className="flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-white/10"
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
      </div>

      {title && (
        <p className="text-xs text-slate-500 dark:text-[#94a3b8]">
          Watch the full video before moving to the next lesson. Skipping ahead
          is disabled.
        </p>
      )}
    </section>
  );
}