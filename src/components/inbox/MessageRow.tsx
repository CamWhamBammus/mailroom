"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MessageSummary } from "@/types";

export function MessageRow({
  message,
  showAccountBadge,
  onCategorize,
}: {
  message: MessageSummary;
  showAccountBadge: boolean;
  onCategorize: (message: MessageSummary) => void;
}) {
  const date = message.date ? new Date(message.date) : null;

  return (
    <Link
      href={`/message/${message.id}?account=${encodeURIComponent(message.account)}`}
      className={cn(
        "flex items-center gap-3 border-b border-walnut-500/8 px-4 py-3 text-sm transition-colors last:border-b-0 hover:bg-canopy-800/5",
        message.unread && "bg-moss-600/[0.04]"
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 shrink-0 rounded-full", message.unread ? "bg-moss-600" : "bg-transparent")}
      />
      {showAccountBadge && (
        <span
          className="w-20 shrink-0 truncate text-[11px] text-charcoal-600/50"
          title={message.account}
        >
          {message.account.split("@")[0]}
        </span>
      )}
      <span className={cn("w-40 shrink-0 truncate", message.unread ? "font-semibold text-canopy-900" : "text-charcoal-800")}>
        {message.from}
      </span>
      <span className="min-w-0 flex-1 truncate">
        <span className={cn(message.unread ? "font-semibold text-canopy-900" : "text-charcoal-800")}>
          {message.subject}
        </span>
        <span className="text-charcoal-600/60"> — {message.snippet}</span>
      </span>
      {message.category ? (
        <span
          className="shrink-0 rounded px-2 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: `${message.categoryColor}1f`,
            color: message.categoryColor ?? undefined,
          }}
        >
          {message.category}
        </span>
      ) : (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onCategorize(message);
          }}
          className="flex shrink-0 items-center gap-1 rounded px-2 py-0.5 text-xs text-charcoal-600/50 hover:bg-moss-600/10 hover:text-moss-600"
        >
          <Tag size={11} />
          Categorize
        </button>
      )}
      <span className="w-16 shrink-0 text-right text-xs text-charcoal-600/50">
        {date ? formatDistanceToNow(date, { addSuffix: false }) : ""}
      </span>
    </Link>
  );
}
