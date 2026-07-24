import type { HTMLAttributes, ReactNode } from "react";
export interface CardProps extends HTMLAttributes<HTMLElement> { children: ReactNode; elevated?: boolean; }
export function Card({ children, elevated=false, className="", ...props }: CardProps) {
  return <article className={`rounded-md border border-gray-100 bg-ivory-50 p-5 transition duration-base ease-luxury ${elevated ? "shadow-hover" : "shadow-card hover:-translate-y-1 hover:shadow-hover"} ${className}`} {...props}>{children}</article>;
}
