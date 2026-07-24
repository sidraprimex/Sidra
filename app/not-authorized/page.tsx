import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";

export default function NotAuthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ivory-100 px-4">
      <div className="w-full max-w-2xl">
        <EmptyState title="This room is reserved." message="Your current Sidra role does not grant access to this private area." action={<Link href="/account/overview" className="text-caption text-gold-600 underline underline-offset-4">Return to your account</Link>} />
      </div>
    </main>
  );
}
