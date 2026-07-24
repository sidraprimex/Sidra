import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ivory-100 px-4">
      <div className="w-full max-w-2xl">
        <EmptyState
          title="This room is not part of Sidra."
          message="The address may have changed, or this experience has not opened yet."
          action={
            <Link
              href="/"
              className="text-caption text-gold-600 underline underline-offset-4"
            >
              Return to the entrance
            </Link>
          }
        />
      </div>
    </main>
  );
}
