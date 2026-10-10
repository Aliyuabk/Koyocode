"use client";

import { forwardRef, useState } from "react";
import { EyeIcon, EyeSlashIcon } from "./Icons";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
};

const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, icon, error, type = "text", id, className = "", ...rest },
  ref
) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200"
        >
          {label}
        </label>
      )}

      <div
        className={`group relative flex items-center rounded-xl border bg-white transition-all duration-200 dark:bg-slate-900 ${
          error
            ? "border-red-300 focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-100 dark:border-red-800 dark:focus-within:border-red-500 dark:focus-within:ring-red-950/50"
            : "border-slate-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100 dark:border-slate-700 dark:focus-within:border-blue-500 dark:focus-within:ring-blue-950/50"
        }`}
      >
        {icon && (
          <span className="pointer-events-none absolute left-3.5 flex h-5 w-5 items-center justify-center text-slate-400 transition group-focus-within:text-blue-600 dark:text-slate-500 dark:group-focus-within:text-blue-400">
            {icon}
          </span>
        )}

        <input
          ref={ref}
          id={id}
          type={inputType}
          className={`w-full bg-transparent px-4 py-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500 ${
            icon ? "pl-11" : ""
          } ${isPassword ? "pr-11" : ""} ${className}`}
          {...rest}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
          </button>
        )}
      </div>

      {error && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600 animate-fade-in dark:text-red-400">
          <span className="inline-block h-1 w-1 rounded-full bg-red-500" />
          {error}
        </p>
      )}
    </div>
  );
});

export default Input;