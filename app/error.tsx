"use client";
import { ErrorState } from "@/components/ui/ErrorState";
export default function GlobalError({error,reset}:{error:Error & {digest?:string};reset:()=>void}){return <main className="flex min-h-screen items-center justify-center bg-ivory-100 px-4"><div className="w-full max-w-2xl"><ErrorState message={error.message || "The page could not be prepared."} onRetry={reset}/></div></main>}
