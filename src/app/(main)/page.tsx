import { redirect } from "next/navigation";
import Link from "next/link";
import { getCategorizedInbox, type InboxResult } from "@/lib/inbox";
import { listRules } from "@/lib/categories";
import { hasAnyAccount, listAccountEmails } from "@/lib/googleAuth";
import { InboxView } from "@/components/inbox/InboxView";

export default async function InboxPage() {
  // The (main) layout also guards this, but Next renders layout and page
  // concurrently rather than strictly sequentially, so a redirect() thrown
  // in the layout doesn't reliably stop this page's own data fetch from
  // running first — verified against a real "Not connected to Gmail"
  // crash. Checking again here is the actual guard, not a redundant one.
  if (!hasAnyAccount()) {
    redirect("/login");
  }

  const [rules, accounts] = await Promise.all([
    Promise.resolve(listRules()),
    Promise.resolve(listAccountEmails()),
  ]);

  // A Gmail hiccup (expired token, API outage, bad env config) shouldn't
  // take down the whole inbox — catch it here and show a way to retry
  // instead of letting the page 500. Per-account failures are handled a
  // level down in getCategorizedInbox, which still returns what it could.
  let inbox: InboxResult | null = null;
  let loadError: string | null = null;
  try {
    inbox = await getCategorizedInbox({ maxResults: 40 });
  } catch (err) {
    console.error("Mailroom: inbox failed to load:", err);
    loadError = err instanceof Error ? err.message : "Something went wrong loading your inbox.";
  }

  return (
    <main className="paper-grain mx-auto min-h-screen max-w-4xl px-6 py-12">
      {inbox ? (
        <InboxView
          initialMessages={inbox.messages}
          initialPageTokens={inbox.pageTokens}
          rules={rules}
          accounts={accounts}
          failedAccounts={inbox.failedAccounts}
        />
      ) : (
        <div className="rounded-lg border border-clay-500/20 bg-parchment-paper px-6 py-10 text-center shadow-soft">
          <p className="text-sm text-charcoal-800">Couldn&rsquo;t load your inbox.</p>
          {loadError && <p className="mt-1 text-xs text-charcoal-600/60">{loadError}</p>}
          <Link href="/" className="mt-4 inline-block text-sm font-medium text-moss-600 hover:underline">
            Try again
          </Link>
        </div>
      )}
    </main>
  );
}
