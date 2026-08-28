import type { CategoryRule, MatchType, MessageDetail, MessageSummary } from "@/types";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? "Something went wrong.");
  }
  return res.json();
}

export const api = {
  listMessages: (pageTokens?: Record<string, string>, query?: string) =>
    fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageTokens, query }),
    }).then((r) => json<{ messages: MessageSummary[]; pageTokens: Record<string, string | null> }>(r)),

  attachmentUrl: (account: string, messageId: string, attachmentId: string, filename: string) =>
    `/api/messages/${messageId}/attachments/${attachmentId}?account=${encodeURIComponent(account)}&filename=${encodeURIComponent(filename)}`,

  getMessage: (account: string, id: string, showImages = false) =>
    fetch(`/api/messages/${id}?account=${encodeURIComponent(account)}${showImages ? "&showImages=1" : ""}`, {
      cache: "no-store",
    }).then((r) => json<MessageDetail>(r)),

  send: (data: {
    from: string;
    to: string;
    subject: string;
    body: string;
    threadId?: string;
    inReplyTo?: string;
    references?: string;
  }) =>
    fetch("/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => json<{ ok: boolean; id: string }>(r)),

  listAccounts: () => fetch("/api/accounts", { cache: "no-store" }).then((r) => json<{ accounts: string[] }>(r)),

  listRules: () => fetch("/api/rules", { cache: "no-store" }).then((r) => json<{ rules: CategoryRule[] }>(r)),

  addRule: (data: { name: string; matchType: MatchType; value: string; color?: string }) =>
    fetch("/api/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => json<{ rule: CategoryRule }>(r)),

  updateRule: (id: string, patch: Partial<Pick<CategoryRule, "name" | "matchType" | "value" | "color" | "order">>) =>
    fetch(`/api/rules/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).then((r) => json<{ rule: CategoryRule }>(r)),

  deleteRule: (id: string) => fetch(`/api/rules/${id}`, { method: "DELETE" }).then((r) => json(r)),

  sendToAlmanacTask: (data: { title: string; notes?: string; dueDate?: string | null }) =>
    fetch("/api/almanac/task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => json<{ id: string }>(r)),

  sendToAlmanacEvent: (data: { title: string; notes?: string; date: string; startTime?: string; endTime?: string }) =>
    fetch("/api/almanac/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => json<{ id: string }>(r)),
};
