import { getMessage } from "./gmail";
import { containsRemoteImage, sanitizeEmailHtml } from "./sanitizeEmail";
import type { MessageDetail } from "@/types";

export async function getSanitizedMessage(
  account: string,
  id: string,
  allowRemoteImages: boolean
): Promise<MessageDetail> {
  const message = await getMessage(account, id);
  const hasRemoteImages = message.htmlBody ? containsRemoteImage(message.htmlBody) : false;
  const htmlBody = message.htmlBody ? sanitizeEmailHtml(message.htmlBody, { allowRemoteImages }) : null;
  return { ...message, htmlBody, hasRemoteImages };
}
