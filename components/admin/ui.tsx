"use client";

import { ReactNode } from "react";

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
          <p className="mt-1 text-sm text-slate-600 dark:text-[#94a3b8]">
            {subtitle}
          </p>
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
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
  }[size];
  const variants = {
    primary:
      "bg-purple-700 text-white hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-500",
    success:
      "bg-emerald-600 text-white hover:bg-emerald-700",
    danger:
      "bg-red-600 text-white hover:bg-red-700",
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
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg animate-scale-in rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-[#1f2a44] dark:bg-[#131c33]"
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
   INPUT / TEXTAREA / SELECT
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