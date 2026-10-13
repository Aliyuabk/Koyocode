"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  slotId: keyof typeof PLACEMENTS | string;
  className?: string;
};

const PLACEMENTS = {
  homepage_top: { width: "100%", height: 90 },
  homepage_bottom: { width: "100%", height: 250 },
  courses_sidebar: { width: "100%", height: 600 },
  lesson_bottom: { width: "100%", height: 250 },
  dashboard_sidebar: { width: "100%", height: 600 },
};

declare global {
  interface Window {
    adsbygoogle?: any;
  }
}

export default function AdSlot({ slotId, className = "" }: Props) {
  const [ready, setReady] = useState(false);
  const insRef = useRef<HTMLModElement>(null);

  // Read config from a data attribute set by the parent (server) via <AdConfig />
  useEffect(() => {
    const configEl = document.getElementById("ads-config");
    if (!configEl) return;

    try {
      const config = JSON.parse(configEl.textContent ?? "{}");
      if (!config.enabled) return;
      if (!config.slots?.[slotId]) return;
      if (!config.clientId) return;

      // Inject AdSense script once
      if (!document.querySelector("script[data-adsense]")) {
        const s = document.createElement("script");
        s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.clientId}`;
        s.async = true;
        s.setAttribute("data-adsense", "true");
        s.crossOrigin = "anonymous";
        document.head.appendChild(s);
      }

      setTimeout(() => {
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          setReady(true);
        } catch (e) {
          console.error("adsbygoogle error:", e);
        }
      }, 100);
    } catch (e) {
      console.error("AdSlot config error:", e);
    }
  }, [slotId]);

  const dims = PLACEMENTS[slotId as keyof typeof PLACEMENTS] ?? {
    width: "100%",
    height: 250,
  };

  if (!ready) return null;

  const clientId = (() => {
    const el = document.getElementById("ads-config");
    if (!el) return null;
    try {
      return JSON.parse(el.textContent ?? "{}").clientId ?? null;
    } catch {
      return null;
    }
  })();

  if (!clientId) return null;

  return (
    <div
      className={`mx-auto flex flex-col items-center ${className}`}
      style={{ maxWidth: "100%" }}
    >
      <span className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#64748b]">
        Advertisement
      </span>
      <ins
        ref={insRef}
        className="adsbygoogle block"
        style={{ display: "block", width: dims.width, height: dims.height }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}