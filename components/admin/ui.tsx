"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

/* ============================================================
   PAGE HEADER
   ============================================================ */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-[#f1f5f9]">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-600 dark:text-[#94a3b8]">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/* ============================================================
   BUTTON
   ============================================================ */
export function Btn({
  children,
  variant = "primary",
  size = "md",
  onClick,
  type = "button",
  disabled,
  className = "",
  title,
}: {
  children: ReactNode;
  variant?: "primary" | "ghost" | "danger" | "success";
  size?: "sm" | "md";
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
  title?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-bold transition disabled:cursor-not-allowed disabled:opacity-60";
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-5 py-2.5 text-sm" }[size];
  const variants = {
    primary:
      "bg-purple-700 text-white hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-500",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost:
      "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#cbd5e1] dark:hover:bg-[#1b2742]",
  }[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${base} ${sizes} ${variants} ${className}`}
    >
      {children}
    </button>
  );
}

/* ============================================================
   MODAL
   ============================================================ */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const widths = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl" }[size];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`w-full ${widths} animate-scale-in rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-[#1f2a44] dark:bg-[#131c33]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-[#1f2a44]">
          <h3 className="text-lg font-black text-slate-900 dark:text-[#f1f5f9]">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-[#1b2742]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4 dark:border-[#1f2a44]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   FIELD / INPUTS
   ============================================================ */
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-[#cbd5e1]">
        {label}
      </span>
      {children}
      {hint && (
        <span className="mt-1 block text-xs text-slate-500 dark:text-[#94a3b8]">
          {hint}
        </span>
      )}
    </label>
  );
}

export const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:text-[#f1f5f9] dark:focus:border-purple-500 dark:focus:ring-purple-950/50";

/* ============================================================
   SEARCH BAR
   ============================================================ */
export function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 transition focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-100 dark:border-[#1f2a44] dark:bg-[#0e1526] dark:focus-within:border-purple-500 dark:focus-within:ring-purple-950/50">
      <span className="text-slate-400 dark:text-[#64748b]">⌕</span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-[#f1f5f9] dark:placeholder:text-[#64748b]"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-[#f1f5f9]"
          aria-label="Clear"
        >
          ✕
        </button>
      )}
    </div>
  );
}

/* ============================================================
   STATUS BADGE
   ============================================================ */
export function Badge({
  tone = "slate",
  children,
}: {
  tone?: "slate" | "emerald" | "amber" | "red" | "purple" | "blue";
  children: ReactNode;
}) {
  const tones = {
    slate:
      "bg-slate-100 text-slate-600 dark:bg-[#1b2742] dark:text-[#94a3b8]",
    emerald:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
    amber:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
    red: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300",
    purple:
      "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
  }[tone];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${tones}`}
    >
      {children}
    </span>
  );
}

/* ============================================================
   EMPTY STATE
   ============================================================ */
export function EmptyState({
  icon = "📭",
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center dark:border-[#1f2a44] dark:bg-[#0e1526]">
      <p className="text-5xl">{icon}</p>
      <p className="mt-4 text-lg font-black text-slate-900 dark:text-[#f1f5f9]">
        {title}
      </p>
      {description && (
        <p className="mt-1 max-w-md text-sm text-slate-600 dark:text-[#94a3b8]">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/* ============================================================
   CONFIRM DIALOG
   ============================================================ */
export function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title,
  message,
  confirmLabel = "Delete",
  tone = "danger",
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  tone?: "danger" | "primary";
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <Btn variant="ghost" onClick={onCancel}>
            Cancel
          </Btn>
          <Btn variant={tone} onClick={onConfirm}>
            {confirmLabel}
          </Btn>
        </>
      }
    >
      <p className="text-sm leading-7 text-slate-700 dark:text-[#cbd5e1]">
        {message}
      </p>
    </Modal>
  );
}

/* ============================================================
   TOAST (lightweight)
   ============================================================ */
type ToastCtx = { show: (msg: string, tone?: "ok" | "err") => void };
let toastSetter: ToastCtx | null = null;

export function toast(msg: string, tone: "ok" | "err" = "ok") {
  toastSetter?.show(msg, tone);
}

export function ToastHost() {
  const [items, setItems] = useState<
    { id: number; msg: string; tone: "ok" | "err" }[]
  >([]);
  const idRef = useRef(0);

  useEffect(() => {
    toastSetter = {
      show: (msg, tone = "ok") => {
        const id = ++idRef.current;
        setItems((arr) => [...arr, { id, msg, tone }]);
        setTimeout(() => {
          setItems((arr) => arr.filter((x) => x.id !== id));
        }, 3000);
      },
    };
    return () => {
      toastSetter = null;
    };
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto animate-slide-down rounded-xl border px-4 py-3 text-sm font-bold shadow-2xl ${
            t.tone === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
              : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300"
          }`}
        >
          {t.tone === "ok" ? "✓ " : "⚠ "}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   CSV EXPORT
   ============================================================ */
export function exportCSV(
  filename: string,
  rows: Record<string, any>[],
  columns: { key: string; label: string }[]
) {
  if (rows.length === 0) {
    toast("Nothing to export", "err");
    return;
  }

  const escape = (v: any) => {
    const s = v === null || v === undefined ? "" : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const header = columns.map((c) => escape(c.label)).join(",");
  const body = rows
    .map((r) => columns.map((c) => escape(r[c.key])).join(","))
    .join("\n");

  const csv = `${header}\n${body}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);

  toast(`Exported ${rows.length} rows`);
}