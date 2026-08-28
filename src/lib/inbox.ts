import { listInboxMessages } from "./gmail";
import { listRules, classify } from "./categories";
import { listAccountEmails } from "./googleAuth";
import type { MessageSummary } from "@/types";

export interface InboxResult {
  messages: MessageSummary[];
  /** Per-account next-page token — null means that account has no more results. */
  pageTokens: Record<string, string | null>;
  /** Accounts whose fetch failed this round (expired token, API error, etc.) — the rest of the inbox still loads around them. */
  failedAccounts: string[];
}

/**
 * Fetches the inbox from every connected account in parallel, tags each
 * message with which account it came from, and merges everything into one
 * date-sorted feed. "Load more" is per-account under the hood — pass back
 * the `pageTokens` this returns as `pageTokens` on the next call to
 * continue exactly where each account left off (an account already at the
 * end is simply omitted from the next fetch).
 *
 * Per-account fetches are settled independently (not Promise.all) so one
 * broken account — an expired token, a transient Gmail API error — can't
 * blank out mail from every other account too.
 */
export async function getCategorizedInbox(opts?: {
  maxResults?: number;
  pageTokens?: Record<string, string>;
  query?: string;
}): Promise<InboxResult> {
  const accountEmails = listAccountEmails();
  const rules = listRules();

  const settled = await Promise.allSettled(
    accountEmails.map(async (email) => {
      const { messages, nextPageToken } = await listInboxMessages(email, {
        maxResults: opts?.maxResults ?? 40,
        pageToken: opts?.pageTokens?.[email],
        query: opts?.query,
      });
      return { email, messages, nextPageToken };
    })
  );

  const failedAccounts: string[] = [];
  const results = settled.flatMap((r, i) => {
    if (r.status === "fulfilled") return [r.value];
    failedAccounts.push(accountEmails[i]);
    console.error(`Mailroom: failed to load inbox for ${accountEmails[i]}:`, r.reason);
    return [];
  });

  const merged = results
    .flatMap((r) => r.messages)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const withCategory: MessageSummary[] = merged.map((m) => {
    const rule = classify(m, rules);
    return { ...m, category: rule?.name ?? null, categoryColor: rule?.color ?? null };
  });

  const pageTokens: Record<string, string | null> = {};
  for (const r of results) pageTokens[r.email] = r.nextPageToken;

  return { messages: withCategory, pageTokens, failedAccounts };
}
