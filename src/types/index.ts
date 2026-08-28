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
  category: string | null;
  categoryColor: string | null;
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
  hasRemoteImages: boolean;
}

export type MatchType = "from-domain" | "from-contains" | "subject-contains" | "snippet-contains";

export interface CategoryRule {
  id: string;
  name: string;
  color: string;
  matchType: MatchType;
  value: string;
  order: number;
  createdAt: string;
}
