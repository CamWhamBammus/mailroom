import Link from "next/link";
import { Mail } from "lucide-react";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="paper-grain flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-lg border border-walnut-500/15 bg-parchment-paper p-8 text-center shadow-lifted">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-moss-600 to-canopy-800 text-parchment-50">
          <Mail size={22} strokeWidth={1.75} />
        </div>
        <h1 className="mt-4 font-serif text-2xl text-canopy-900">Mailroom</h1>
        <p className="mt-2 text-sm text-charcoal-600">
          Connect your Gmail to sort mail into categories and send from here.
        </p>

        {error && (
          <p className="mt-4 rounded-md border border-clay-500/25 bg-clay-500/8 px-3 py-2 text-xs text-clay-500">
            Couldn&rsquo;t connect: {error}
          </p>
        )}

        <Link
          href="/api/auth/login"
          className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-moss-600 text-sm font-medium text-parchment-50 transition-colors hover:bg-canopy-800"
        >
          Connect Gmail
        </Link>

        <p className="mt-4 text-xs text-charcoal-600/60">
          You&rsquo;ll approve access on Google&rsquo;s own sign-in page — Mailroom never sees your
          password.
        </p>
      </div>
    </main>
  );
}
