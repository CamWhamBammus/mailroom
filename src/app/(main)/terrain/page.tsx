import { redirect } from "next/navigation";
import { getCategorizedInbox } from "@/lib/inbox";
import { hasAnyAccount } from "@/lib/googleAuth";
import { TerrainView } from "@/components/terrain/TerrainView";

export default async function TerrainPage() {
  if (!hasAnyAccount()) {
    redirect("/login");
  }

  // A bigger sample than the Inbox's default 40 gives a more meaningful
  // shape, but stays well under Gmail's per-account rate limit for a
  // single page load (~100 metadata fetches per account).
  const { messages } = await getCategorizedInbox({ maxResults: 100 });

  return (
    <main className="paper-grain mx-auto min-h-screen max-w-4xl px-6 py-12">
      <TerrainView messages={messages} />
    </main>
  );
}
