"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, CalendarPlus, Download, Image as ImageIcon, Paperclip, Reply } from "lucide-react";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { SendToAlmanacModal } from "@/components/inbox/SendToAlmanacModal";
import type { MessageDetail } from "@/types";

export function MessageDetailView({ initialMessage }: { initialMessage: MessageDetail }) {
  const [message, setMessage] = useState(initialMessage);
  const [showImages, setShowImages] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);
  const [showAlmanacModal, setShowAlmanacModal] = useState(false);

  async function loadImages() {
    setLoadingImages(true);
    try {
      const fresh = await api.getMessage(message.account, message.id, true);
      setMessage(fresh);
      setShowImages(true);
    } finally {
      setLoadingImages(false);
    }
  }

  // Reply always sends from the account the message actually arrived at,
  // not just whichever account happens to be first — otherwise a reply to
  // your work address could silently go out from your personal one.
  const replyHref = `/compose?from=${encodeURIComponent(message.account)}&to=${encodeURIComponent(
    message.fromEmail
  )}&subject=${encodeURIComponent(
    message.subject.startsWith("Re:") ? message.subject : `Re: ${message.subject}`
  )}&threadId=${encodeURIComponent(message.threadId)}&inReplyTo=${encodeURIComponent(message.id)}`;

  return (
    <div>
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-charcoal-600 hover:text-canopy-900">
        <ArrowLeft size={14} />
        Back to inbox
      </Link>

      <div className="mt-4 rounded-lg border border-walnut-500/15 bg-parchment-paper p-6 shadow-soft">
        <h1 className="font-serif text-2xl text-canopy-900">{message.subject}</h1>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 text-sm text-charcoal-600">
          <span className="font-medium text-charcoal-800">{message.from}</span>
          <span className="text-charcoal-600/60">&lt;{message.fromEmail}&gt;</span>
          <span className="text-charcoal-600/50">
            · {message.date ? format(new Date(message.date), "MMM d, yyyy 'at' h:mm a") : ""}
          </span>
        </div>
        <p className="mt-1 text-xs text-charcoal-600/60">To: {message.to}</p>
        <p className="mt-0.5 text-xs text-charcoal-600/50">Received at: {message.account}</p>

        <div className="mt-4 flex gap-2">
          <Link href={replyHref}>
            <Button variant="secondary" size="sm">
              <Reply size={14} />
              Reply
            </Button>
          </Link>
          <Button variant="secondary" size="sm" onClick={() => setShowAlmanacModal(true)}>
            <CalendarPlus size={14} />
            Send to Almanac
          </Button>
        </div>

        <hr className="leaf-divider my-5" />

        {message.hasRemoteImages && !showImages && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-md border border-amber-500/25 bg-amber-500/8 px-3 py-2 text-sm text-amber-500">
            <span className="flex items-center gap-1.5">
              <ImageIcon size={14} />
              Images are blocked to protect your privacy.
            </span>
            <Button variant="secondary" size="sm" onClick={loadImages} disabled={loadingImages}>
              {loadingImages ? "Loading…" : "Show images"}
            </Button>
          </div>
        )}

        {message.htmlBody ? (
          <iframe
            title={message.subject}
            srcDoc={message.htmlBody}
            sandbox="allow-popups allow-popups-to-escape-sandbox"
            className="w-full rounded-md border border-walnut-500/10 bg-white"
            style={{ height: "600px" }}
          />
        ) : message.textBody ? (
          <pre className="whitespace-pre-wrap font-sans text-sm text-charcoal-800">{message.textBody}</pre>
        ) : (
          <p className="text-sm text-charcoal-600/50">This message has no readable body.</p>
        )}

        {message.attachments.length > 0 && (
          <div className="mt-5 border-t border-walnut-500/10 pt-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium tracking-wide text-charcoal-600/70 uppercase">
              <Paperclip size={12} />
              Attachments ({message.attachments.length})
            </p>
            <ul className="space-y-1 text-sm">
              {message.attachments.map((a) => (
                <li key={a.attachmentId}>
                  <a
                    href={api.attachmentUrl(message.account, message.id, a.attachmentId, a.filename)}
                    download={a.filename}
                    className="inline-flex items-center gap-1.5 text-charcoal-600 hover:text-moss-600"
                  >
                    <Download size={13} />
                    {a.filename}
                    <span className="text-xs text-charcoal-600/50">({Math.round(a.size / 1024)} KB)</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {showAlmanacModal && (
        <SendToAlmanacModal message={message} onClose={() => setShowAlmanacModal(false)} />
      )}
    </div>
  );
}
