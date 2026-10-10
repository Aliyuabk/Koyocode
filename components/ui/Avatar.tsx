"use client";

import { useState } from "react";

type Props = {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

export default function Avatar({
  src,
  name,
  email,
  size = "md",
  className = "",
}: Props) {
  const [imgError, setImgError] = useState(false);

  const initials = (name || email || "?")
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base",
    xl: "h-20 w-20 text-2xl",
  }[size];

  const showImage = src && !imgError;

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ${sizes} ${className}`}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name || "User avatar"}
          onError={() => setImgError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800 font-black text-white dark:from-blue-500 dark:to-blue-700">
          {initials}
        </span>
      )}
    </span>
  );
}