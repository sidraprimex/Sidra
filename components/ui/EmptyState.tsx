import type { ReactNode } from "react";
export function EmptyState({ title, message, action }: { title:string; message:string; action?:ReactNode }) {
 return <section className="rounded-lg border border-gray-100 bg-ivory-50 p-8 text-center shadow-card"><div className="mx-auto mb-4 h-px w-16 bg-gold-500"/><h2 className="font-display text-h2">{title}</h2><p className="mx-auto mt-3 max-w-xl text-caption text-gray-700">{message}</p>{action && <div className="mt-5">{action}</div>}</section>;
}
