"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-black-950 px-4 text-ivory-100">
        <main className="max-w-xl text-center">
          <p className="text-micro uppercase tracking-[0.18em] text-gold-500">SIDRA</p>
          <h1 className="mt-3 font-display text-h1">The experience paused safely.</h1>
          <p className="mt-4 text-caption text-gray-300">No data was changed. Re-enter when you are ready.</p>
          <button className="mt-6 rounded-sm bg-gold-500 px-4 py-2 text-caption text-black-900" onClick={reset}>
            Re-enter
          </button>
        </main>
      </body>
    </html>
  );
}
