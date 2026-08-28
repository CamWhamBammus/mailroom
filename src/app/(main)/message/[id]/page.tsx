import { redirect, notFound } from "next/navigation";
import { getSanitizedMessage } from "@/lib/messageDetail";
import { hasAnyAccount, hasAccount } from "@/lib/googleAuth";
import { MessageDetailView } from "@/components/inbox/MessageDetailView";

export default async function MessagePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ account?: string }>;
}) {
  if (!hasAnyAccount()) {
    redirect("/login");
  }

  const { id } = await params;
  const { account } = await searchParams;

  if (!account || !hasAccount(account)) {
    notFound();
  }

  const message = await getSanitizedMessage(account, id, false);

  return (
    <main className="paper-grain mx-auto min-h-screen max-w-3xl px-6 py-12">
      <MessageDetailView initialMessage={message} />
    </main>
  );
}
