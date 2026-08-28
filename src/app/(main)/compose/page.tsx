import { listAccountEmails } from "@/lib/googleAuth";
import { ComposeView } from "@/components/compose/ComposeView";

export default async function ComposePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; subject?: string; threadId?: string; inReplyTo?: string }>;
}) {
  const { from, to, subject, threadId, inReplyTo } = await searchParams;
  const accounts = listAccountEmails();

  return (
    <main className="paper-grain mx-auto min-h-screen max-w-2xl px-6 py-12">
      <ComposeView
        accounts={accounts}
        initialFrom={from && accounts.includes(from) ? from : ""}
        initialTo={to ?? ""}
        initialSubject={subject ?? ""}
        threadId={threadId}
        inReplyTo={inReplyTo}
      />
    </main>
  );
}
