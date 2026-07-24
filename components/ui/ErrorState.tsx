"use client";
import { Button } from "@/components/ui/Button";
export function ErrorState({ message, onRetry }: { message:string; onRetry?:()=>void }) {
 return <section className="rounded-lg border border-error/20 bg-ivory-50 p-8 text-center"><h2 className="font-display text-h2">Something interrupted the experience.</h2><p className="mx-auto mt-3 max-w-xl text-caption text-gray-700">{message}</p>{onRetry && <Button className="mt-5" onClick={onRetry}>Try again</Button>}</section>;
}
