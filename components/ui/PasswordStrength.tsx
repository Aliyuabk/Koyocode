"use client";

import { checkPassword } from "@/lib/password";

export default function PasswordStrength({ value }: { value: string }) {
  const { score, label, color, checks } = checkPassword(value);

  if (value.length === 0) return null;

  return (
    <div className="mt-2">
      {/* Bar */}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i <= score ? color : "bg-slate-200 dark:bg-[#1f2a44]"
            }`}
          />
        ))}
      </div>

      {/* Label */}
      <div className="mt-1.5 flex items-center justify-between">
        <p
          className={`text-xs font-bold ${
            score >= 4
              ? "text-emerald-600 dark:text-emerald-400"
              : score >= 3
              ? "text-blue-600 dark:text-blue-400"
              : score >= 2
              ? "text-amber-600 dark:text-amber-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {label}
        </p>
      </div>

      {/* Checklist */}
      <ul className="mt-2 grid grid-cols-2 gap-1 text-xs">
        <Check ok={checks.length}>8+ characters</Check>
        <Check ok={checks.upper}>Uppercase letter</Check>
        <Check ok={checks.lower}>Lowercase letter</Check>
        <Check ok={checks.number}>Number</Check>
      </ul>
    </div>
  );
}

function Check({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li
      className={`flex items-center gap-1.5 ${
        ok
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-slate-400 dark:text-[#64748b]"
      }`}
    >
      <span className="text-[10px] font-black">{ok ? "✓" : "○"}</span>
      <span>{children}</span>
    </li>
  );
}