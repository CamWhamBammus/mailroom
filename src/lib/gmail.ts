import { google, gmail_v1 } from "googleapis";
import { getAuthenticatedClient } from "./googleAuth";

function getGmailClient(email: string): gmail_v1.Gmail {
  return google.gmail({ version: "v1", auth: getAuthenticatedClient(email) });
}

type Header = { name?: string | null; value?: string | null };

function getHeaderValue(headers: Header[], name: string): string {
  return headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function parseFromHeader(raw: string): { name: string; email: string } {
  const match = raw.match(/^(.*?)\s*<(.+)>$/);
  if (match) {
    return { name: match[1].replace(/^"|"$/g, "").trim(), email: match[2].trim() };
  }
  return { name: "", email: raw.trim() };
}

function decodeBase64Url(data: string): string {
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
}

export interface MessageSummary {
  id: string;
  threadId: string;
  account: string;
  from: string;
  fromEmail: string;
  subject: string;
  snippet: string;
  date: string;
  unread: boolean;
}

export async function listInboxMessages(
  account: string,
  { maxResults = 40, pageToken, query }: { maxResults?: number; pageToken?: string; query?: string } = {}
): Promise<{
  messages: MessageSummary[];
  nextPageToken: string | null;
}> {
  const gmail = getGmailClient(account);
  const listRes = await gmail.users.messages.list({
    userId: "me",
    labelIds: ["INBOX"],
    maxResults,
    pageToken,
    // Gmail's native search syntax (from:, subject:, has:attachment, etc.)
    // still scoped to labelIds: ["INBOX"] above, so a search never surfaces
    // archived/sent mail — same boundary the rest of the app assumes.
    q: query || undefined,
  });
  const ids = listRes.data.messages ?? [];

  const messages = await Promise.all(
    ids.map(async (m): Promise<MessageSummary> => {
      const res = await gmail.users.messages.get({
        userId: "me",
        id: m.id!,
        format: "metadata",
        metadataHeaders: ["From", "Subject", "Date"],
      });
      const headers = res.data.payload?.headers ?? [];
      const { name: fromName, email: fromEmail } = parseFromHeader(getHeaderValue(headers, "From"));
      return {
        id: res.data.id!,
        threadId: res.data.threadId!,
        account,
        from: fromName || fromEmail,
        fromEmail,
        subject: getHeaderValue(headers, "Subject") || "(no subject)",
        snippet: res.data.snippet ?? "",
        date: getHeaderValue(headers, "Date"),
        unread: (res.data.labelIds ?? []).includes("UNREAD"),
      };
    })
  );

  return { messages, nextPageToken: listRes.data.nextPageToken ?? null };
}

export interface MessageDetail {
  id: string;
  threadId: string;
  account: string;
  from: string;
  fromEmail: string;
  to: string;
  subject: string;
  date: string;
  htmlBody: string | null;
  textBody: string | null;
  attachments: { attachmentId: string; filename: string; mimeType: string; size: number }[];
}

function findBodyData(part: gmail_v1.Schema$MessagePart, mimeType: string): string | null {
  if (part.mimeType === mimeType && part.body?.data) return part.body.data;
  for (const child of part.parts ?? []) {
    const found = findBodyData(child, mimeType);
    if (found) return found;
  }
  return null;
}

function collectAttachments(
  part: gmail_v1.Schema$MessagePart | undefined,
  out: { attachmentId: string; filename: string; mimeType: string; size: number }[]
) {
  if (!part) return;
  if (part.filename && part.body?.attachmentId) {
    out.push({
      attachmentId: part.body.attachmentId,
      filename: part.filename,
      mimeType: part.mimeType || "application/octet-stream",
      size: part.body.size ?? 0,
    });
  }
  for (const child of part.parts ?? []) collectAttachments(child, out);
}

export async function getMessage(account: string, id: string): Promise<MessageDetail> {
  const gmail = getGmailClient(account);
  const res = await gmail.users.messages.get({ userId: "me", id, format: "full" });
  const payload = res.data.payload;
  const headers = payload?.headers ?? [];

  const htmlData = payload ? findBodyData(payload, "text/html") : null;
  const textData = payload ? findBodyData(payload, "text/plain") : null;

  const attachments: { attachmentId: string; filename: string; mimeType: string; size: number }[] = [];
  collectAttachments(payload, attachments);

  const { name: fromName, email: fromEmail } = parseFromHeader(getHeaderValue(headers, "From"));

  return {
    id: res.data.id!,
    threadId: res.data.threadId!,
    account,
    from: fromName || fromEmail,
    fromEmail,
    to: getHeaderValue(headers, "To"),
    subject: getHeaderValue(headers, "Subject") || "(no subject)",
    date: getHeaderValue(headers, "Date"),
    htmlBody: htmlData ? decodeBase64Url(htmlData) : null,
    textBody: textData ? decodeBase64Url(textData) : null,
    attachments,
  };
}

/** Strips CRLF from user-supplied header values so a form field can't inject extra headers (e.g. a hidden Bcc). */
function sanitizeHeaderValue(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function encodeSubject(subject: string): string {
  const clean = sanitizeHeaderValue(subject);
  if (/^[\x00-\x7F]*$/.test(clean)) return clean;
  return `=?UTF-8?B?${Buffer.from(clean, "utf-8").toString("base64")}?=`;
}

export async function sendMessage({
  from,
  to,
  subject,
  body,
  threadId,
  inReplyTo,
  references,
}: {
  from: string;
  to: string;
  subject: string;
  body: string;
  threadId?: string;
  inReplyTo?: string;
  references?: string;
}) {
  const gmail = getGmailClient(from);

  const headerLines = [
    `To: ${sanitizeHeaderValue(to)}`,
    `From: ${from}`,
    `Subject: ${encodeSubject(subject)}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
  ];
  if (inReplyTo) headerLines.push(`In-Reply-To: ${sanitizeHeaderValue(inReplyTo)}`);
  if (references) headerLines.push(`References: ${sanitizeHeaderValue(references)}`);

  const raw = Buffer.from(`${headerLines.join("\r\n")}\r\n\r\n${body}`, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw, threadId },
  });
  return res.data;
}

export async function getAttachment(
  account: string,
  messageId: string,
  attachmentId: string
): Promise<Buffer> {
  const gmail = getGmailClient(account);
  const res = await gmail.users.messages.attachments.get({
    userId: "me",
    messageId,
    id: attachmentId,
  });
  const data = res.data.data ?? "";
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}
