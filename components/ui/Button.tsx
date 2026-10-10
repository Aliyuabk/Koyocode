"use client";

import { useFormStatus } from "react-dom";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  variant?: "primary" | "secondary";
};

export default function Button({
  children,
  loading,
  variant = "primary",
  className = "",
  disabled,
  ...rest
}: Props) {
  const { pending } = useFormStatus();
  const isBusy = loading || pending;

  const base =
    "inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-70";

  const styles =
    variant === "primary"
      ? "bg-blue-700 text-white shadow-lg shadow-blue-700/20 hover:bg-blue-800 hover:shadow-xl hover:shadow-blue-700/30 dark:bg-blue-600 dark:hover:bg-blue-500 active:scale-[0.99]"
      : "border border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-blue-600 dark:hover:bg-slate-700";

  return (
    <button
      {...rest}
      disabled={isBusy || disabled}
      className={`${base} ${styles} ${className}`}
    >
      {isBusy ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          <span>Please wait…</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}