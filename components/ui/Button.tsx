"use client";
import type { ButtonHTMLAttributes, ReactNode } from "react";
const variants = {
  primary: "bg-gold-500 text-black-900 hover:bg-gold-600 active:translate-y-px",
  secondary: "bg-black-900 text-ivory-100 hover:bg-charcoal-800 active:translate-y-px",
  outline: "border border-gold-500 text-black-900 hover:bg-gold-100 active:translate-y-px",
  ghost: "text-black-900 hover:bg-gray-100 active:translate-y-px",
  danger: "bg-error text-ivory-50 hover:brightness-95 active:translate-y-px",
} as const;
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: keyof typeof variants; loading?: boolean; children: ReactNode; }
export function Button({ variant="primary", loading=false, disabled, className="", children, ...props }: ButtonProps) {
  return <button className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-sm px-4 py-2 font-body text-caption font-medium transition duration-base ease-luxury disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`} disabled={disabled || loading} aria-busy={loading} {...props}>
    {loading && <span className="h-3 w-3 animate-pulse rounded-full bg-current opacity-40" aria-hidden="true" />}{children}
  </button>;
}
