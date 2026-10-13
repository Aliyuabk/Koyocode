"use client";

import { useEffect, useRef } from "react";

type AdUnit = {
  key: string;
  width: number;
  height: number;
  type: "iframe" | "native";
};

const UNITS: Record<string, AdUnit> = {
  "728x90": {
    key: "23812af3dd2898df0109d3d22d37557d",
    width: 728,
    height: 90,
    type: "iframe",
  },
  "300x250": {
    key: "9594d9f587d69b6e47fb4b75b76087bc",
    width: 300,
    height: 250,
    type: "iframe",
  },
  "160x600": {
    key: "9f3c182e576367bf7524d3e56410ed45",
    width: 160,
    height: 600,
    type: "iframe",
  },
  native: {
    key: "4d055891f16a48b06031d6e4b82e780d",
    width: 0,
    height: 0,
    type: "native",
  },
};

export default function AdSlotAdsterra({
  slot,
  className = "",
}: {
  slot: keyof typeof UNITS;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const unit = UNITS[slot];

  useEffect(() => {
    if (!unit || !ref.current) return;

    // Clear previous content (important for React strict mode + remounts)
    ref.current.innerHTML = "";

    if (unit.type === "native") {
      // Native Banner — script + container div
      const script = document.createElement("script");
      script.async = true;
      script.setAttribute("data-cfasync", "false");
      script.src = `https://bauval.org/21/${unit.key}`;
      ref.current.appendChild(script);

      const container = document.createElement("div");
      container.id = `container-${unit.key}`;
      ref.current.appendChild(container);
    } else {
      // Iframe sync — atOptions + invoke script
      const config = document.createElement("script");
      config.type = "text/javascript";
      config.text = `
        atOptions = {
          'key' : '${unit.key}',
          'format' : 'iframe',
          'height' : ${unit.height},
          'width' : ${unit.width},
          'params' : {}
        };
      `;
      ref.current.appendChild(config);

      const invoke = document.createElement("script");
      invoke.src = `https://bauval.org/22/${unit.key}`;
      invoke.async = true;
      ref.current.appendChild(invoke);
    }
  }, [slot, unit]);

  if (!unit) return null;

  return (
    <div className={`mx-auto flex flex-col items-center ${className}`}>
      <span className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#64748b]">
        Advertisement
      </span>
      <div
        ref={ref}
        style={
          unit.type === "native"
            ? { width: "100%", maxWidth: "728px" }
            : {
                width: unit.width,
                height: unit.height,
                maxWidth: "100%",
              }
        }
      />
    </div>
  );
}