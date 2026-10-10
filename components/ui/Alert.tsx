"use client";

import { useEffect, useState } from "react";

type Props = {
  type?: "error" | "success" | "info";
  children: React.ReactNode;
  onClose?: () => void;
};

export default function Alert({ type = "error", children, onClose }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
  }, [children]);

  if (!visible) return null;

  const styles = {
    error:
      "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300",
    success:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
    info:
      "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300",
  }[type];

  const icon = { error: "⚠", success: "✓", info: "ℹ" }[type];

  return (
    <div
      role="alert"
      className={`relative mb-5 flex items-start gap-3 rounded-xl border px-4 py-3.5 text-sm font-medium animate-slide-down ${styles}`}
    >
      <span className="mt-0.5 text-base leading-none">{icon}</span>
      <div className="flex-1 pr-4">{children}</div>

      <button
        type="button"
        onClick={() => {
          setVisible(false);
          onClose?.();
        }}
        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-md text-current opacity-60 transition hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}