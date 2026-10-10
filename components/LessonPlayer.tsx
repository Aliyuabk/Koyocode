"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { persistProgress } from "@/lib/progress";

type Props = {
  lessonId: string;
  youtubeId: string;
  title: string;
  initialPercent?: number;
  onComplete?: () => void;
};

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export default function LessonPlayer({
  lessonId,
  youtubeId,
  title,
  initialPercent = 0,
  onComplete,
}: Props) {
  const playerRef = useRef<any>(null);
  const containerId = `yt-player-${lessonId}`;

  const lastTimeRef = useRef(0);
  const maxWatchedRef = useRef(initialPercent);
  const completedRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);
  const tickIntervalRef = useRef<number | null>(null);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [percent, setPercent] = useState(initialPercent);
  const [completed, setCompleted] = useState(initialPercent >= 95);
  const [error, setError] = useState<string | null>(null);

  // Debounced save
  const scheduleSave = useCallback(
    (pct: number, isDone: boolean) => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(() => {
        persistProgress(lessonId, pct, isDone);
      }, 1500);
    },
    [lessonId]
  );

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      initPlayer();
      return;
    }

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);

    const existing = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      existing?.();
      initPlayer();
    };

    return () => {
      if (tickIntervalRef.current) window.clearInterval(tickIntervalRef.current);
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function initPlayer() {
    if (playerRef.current) return;
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
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
        onError: () => setError("Video could not be loaded."),
      },
    });
  }

  function onPlayerReady(event: any) {
    setReady(true);
    // Rewind to last known percent if resuming
    if (initialPercent > 0 && initialPercent < 95) {
      const duration = event.target.getDuration?.() ?? 0;
      if (duration > 0) {
        const seekTo = (initialPercent / 100) * duration;
        event.target.seekTo(seekTo, true);
        lastTimeRef.current = seekTo;
      }
    }
  }

  function onPlayerStateChange(event: any) {
    const state = event.data;
    // 1 = playing, 2 = paused, 0 = ended
    if (state === 1) {
      setPlaying(true);
      startTicker();
    } else if (state === 2) {
      setPlaying(false);
      stopTicker();
    } else if (state === 0) {
      setPlaying(false);
      stopTicker();
      // Mark completed at end
      if (!completedRef.current) {
        completedRef.current = true;
        setCompleted(true);
        setPercent(100);
        maxWatchedRef.current = 100;
        persistProgress(lessonId, 100, true);
        onComplete?.();
      }
    }
  }

  function startTicker() {
    stopTicker();
    tickIntervalRef.current = window.setInterval(() => {
      const player = playerRef.current;
      if (!player || typeof player.getCurrentTime !== "function") return;

      const current = player.getCurrentTime();
      const duration = player.getDuration?.() ?? 0;
      if (!duration) return;

      // SEEK FORWARD BLOCK: if user jumps ahead >2s, snap back
      if (current > lastTimeRef.current + 2.5) {
        player.seekTo(lastTimeRef.current, true);
        return;
      }

      lastTimeRef.current = current;

      const pct = Math.min(100, Math.round((current / duration) * 100));

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
    }, 1000);
  }

  function stopTicker() {
    if (tickIntervalRef.current) {
      window.clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;
    }
  }

  function handlePlayPause() {
    const player = playerRef.current;
    if (!player) return;
    if (playing) player.pauseVideo();
    else player.playVideo();
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-black shadow-2xl shadow-blue-900/20 dark:border-[#1f2a44]">
      <div className="relative aspect-video w-full bg-black">
        {/* The iframe is injected here by YT.Player */}
        <div id={containerId} className="absolute inset-0 h-full w-full" />

        {/* Custom overlay: play button + completion badge */}
        {ready && (
          <>
            {!playing && !completed && (
              <button
                onClick={handlePlayPause}
                aria-label="Play"
                className="absolute inset-0 flex items-center justify-center bg-black/40 transition hover:bg-black/30"
              >
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-700 text-white shadow-2xl shadow-blue-900/50 transition hover:scale-105 dark:bg-blue-600">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </button>
            )}

            {completed && !playing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="rounded-2xl bg-white/95 px-6 py-4 text-center shadow-xl backdrop-blur dark:bg-[#131c33]/95">
                  <p className="text-3xl">✅</p>
                  <p className="mt-2 font-black text-slate-900 dark:text-[#f1f5f9]">
                    Lesson completed!
                  </p>
                  <p className="text-xs text-slate-500 dark:text-[#94a3b8]">
                    Progress saved
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* CUSTOM CONTROL BAR */}
      <div className="flex items-center gap-4 bg-slate-900 px-4 py-3 text-white">
        <button
          onClick={handlePlayPause}
          disabled={!ready}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 transition hover:bg-blue-600 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* PROGRESS BAR */}
        <div className="flex-1">
          <div className="h-2 overflow-hidden rounded-full bg-white/15">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                completed ? "bg-emerald-500" : "bg-blue-500"
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* PERCENT */}
        <span className="w-12 text-right text-sm font-bold tabular-nums">
          {percent}%
        </span>
      </div>

      {/* TITLE + INFO */}
      <div className="bg-slate-950 px-4 py-3 text-xs text-slate-400">
        <p className="truncate font-semibold text-slate-200">{title}</p>
        <p className="mt-0.5">
          Watch 95% to unlock the next lesson. Seeking ahead is disabled.
        </p>
        {error && (
          <p className="mt-1 text-red-400">⚠ {error}</p>
        )}
      </div>
    </div>
  );
}