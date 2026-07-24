"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

const variants = {
  primary:
    "border border-gold-500 bg-gold-500 text-black-900 hover:border-gold-600 hover:bg-gold-600 active:translate-y-px",
  secondary:
    "border border-black-900 bg-black-900 text-ivory-100 hover:bg-charcoal-800 active:translate-y-px",
  outline:
    "border border-gold-500 bg-transparent text-black-900 hover:bg-gold-100 active:translate-y-px",
  inverseOutline:
    "border border-white/20 bg-white/[0.025] text-ivory-100 hover:border-gold-500 hover:bg-white/[0.07] active:translate-y-px",
  ghost:
    "border border-transparent bg-transparent text-black-900 hover:bg-gray-100 active:translate-y-px",
  danger:
    "border border-error bg-error text-ivory-50 hover:brightness-95 active:translate-y-px",
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-5 py-3 font-body text-caption font-semibold transition duration-base ease-luxury disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <span
          className="h-3.5 w-3.5 animate-pulse rounded-full bg-current opacity-40"
          aria-hidden="true"
        />
      ) : null}
      {children}
    </button>
  );
}
