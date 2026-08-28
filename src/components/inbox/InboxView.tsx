"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, Search, X } from "lucide-react";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Select, TextInput } from "@/components/ui/Field";
import { MessageRow } from "@/components/inbox/MessageRow";
import { QuickCategorizeModal } from "@/components/inbox/QuickCategorizeModal";
import type { CategoryRule, MatchType, MessageSummary } from "@/types";

export function InboxView({
  initialMessages,
  initialPageTokens,
  rules,
  accounts,
  failedAccounts = [],
}: {
  initialMessages: MessageSummary[];
  initialPageTokens: Record<string, string | null>;
  rules: CategoryRule[];
  accounts: string[];
  failedAccounts?: string[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [pageTokens, setPageTokens] = useState(initialPageTokens);
  const [localRules, setLocalRules] = useState(rules);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeAccount, setActiveAccount] = useState<string>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [categorizeTarget, setCategorizeTarget] = useState<MessageSummary | null>(null);

  const showAccountBadge = accounts.length > 1;
  const hasMore = Object.values(pageTokens).some((t) => !!t);

  const categoryNames = useMemo(() => [...new Set(localRules.map((r) => r.name))], [localRules]);

  const byAccount = activeAccount === "all" ? messages : messages.filter((m) => m.account === activeAccount);
  const scoped = unreadOnly ? byAccount.filter((m) => m.unread) : byAccount;
  const uncategorizedCount = scoped.filter((m) => !m.category).length;

  const filtered =
    activeCategory === "all"
      ? scoped
      : activeCategory === "uncategorized"
        ? scoped.filter((m) => !m.category)
        : scoped.filter((m) => m.category === activeCategory);

  function mergeSorted(list: MessageSummary[]) {
    return [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async function fetchLatest() {
    const res = await api.listMessages(undefined, activeQuery || undefined);
    setMessages(res.messages);
    setPageTokens(res.pageTokens);
  }

  async function refresh() {
    setLoading(true);
    try {
      await fetchLatest();
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setActiveQuery(searchInput.trim());
  }

  function clearSearch() {
    setSearchInput("");
    setActiveQuery("");
  }

  // Runs whenever the active search term changes (submitting or clearing),
  // but not on first mount — initial data already came from the server.
  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeQuery]);

  // Kept in a ref so the interval below always calls the latest closure
  // without needing to be torn down and rebuilt every render.
  const fetchLatestRef = useRef(fetchLatest);
  useEffect(() => {
    fetchLatestRef.current = fetchLatest;
  });

  // Gmail has no realistic way to push new mail to a localhost app (that
  // needs a public HTTPS endpoint for Google to call) — this polls
  // instead, close enough to "instant" for a personal inbox. Paused
  // whenever the tab isn't visible so it doesn't burn API quota in the
  // background. Continues to respect whatever search is currently active.
  useEffect(() => {
    const POLL_MS = 60_000;
    let interval: ReturnType<typeof setInterval> | null = null;

    function start() {
      if (interval) return;
      interval = setInterval(() => {
        fetchLatestRef.current();
      }, POLL_MS);
    }
    function stop() {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    }

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        fetchLatestRef.current();
        start();
      } else {
        stop();
      }
    }

    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  async function loadMore() {
    const tokens = Object.fromEntries(
      Object.entries(pageTokens).filter((entry): entry is [string, string] => !!entry[1])
    );
    if (Object.keys(tokens).length === 0) return;

    setLoadingMore(true);
    try {
      const res = await api.listMessages(tokens, activeQuery || undefined);
      setMessages((prev) => mergeSorted([...prev, ...res.messages]));
      setPageTokens((prev) => ({ ...prev, ...res.pageTokens }));
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleCreateRule(data: { name: string; matchType: MatchType; value: string }) {
    const { rule } = await api.addRule(data);
    setLocalRules((prev) => [...prev, rule]);
    await refresh();
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-canopy-900">Inbox</h1>
          <p className="mt-1 text-sm text-charcoal-600">
            {messages.length} messages loaded
            {accounts.length > 1 ? ` across ${accounts.length} accounts` : ""}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {accounts.length > 1 && (
            <Select
              value={activeAccount}
              onChange={(e) => setActiveAccount(e.target.value)}
              className="h-9 w-auto"
            >
              <option value="all">All accounts</option>
              {accounts.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </Select>
          )}
          <Button variant="secondary" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>
      </div>

      {failedAccounts.length > 0 && (
        <p className="mt-3 rounded-md border border-clay-500/20 bg-clay-500/5 px-3 py-2 text-xs text-clay-500">
          Couldn&rsquo;t load mail from {failedAccounts.join(", ")} — showing everything else.
        </p>
      )}

      <form onSubmit={handleSearchSubmit} className="mt-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={14} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-charcoal-600/40" />
          <TextInput
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search all mail — from:recruiter, subject:offer, has:attachment…"
            className="h-9 pl-9"
          />
        </div>
        {activeQuery && (
          <Button type="button" variant="ghost" size="sm" onClick={clearSearch}>
            <X size={13} />
            Clear
          </Button>
        )}
        <Button type="submit" size="sm" disabled={loading}>
          Search
        </Button>
      </form>
      {activeQuery && (
        <p className="mt-2 text-xs text-charcoal-600/60">
          Showing results for <span className="font-medium text-charcoal-800">{activeQuery}</span>
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <CategoryTab active={activeCategory === "all"} onClick={() => setActiveCategory("all")}>
          All ({scoped.length})
        </CategoryTab>
        {categoryNames.map((name) => (
          <CategoryTab key={name} active={activeCategory === name} onClick={() => setActiveCategory(name)}>
            {name} ({scoped.filter((m) => m.category === name).length})
          </CategoryTab>
        ))}
        <CategoryTab active={activeCategory === "uncategorized"} onClick={() => setActiveCategory("uncategorized")}>
          Uncategorized ({uncategorizedCount})
        </CategoryTab>
        <span className="mx-1 h-4 w-px bg-walnut-500/20" />
        <CategoryTab active={unreadOnly} onClick={() => setUnreadOnly((v) => !v)}>
          Unread only
        </CategoryTab>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-walnut-500/15 bg-parchment-paper shadow-soft">
        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-charcoal-600/50">Nothing here.</p>
        ) : (
          filtered.map((message) => (
            <MessageRow
              key={`${message.account}:${message.id}`}
              message={message}
              showAccountBadge={showAccountBadge}
              onCategorize={setCategorizeTarget}
            />
          ))
        )}
      </div>

      {!activeQuery && activeCategory === "all" && activeAccount === "all" && !unreadOnly && hasMore && (
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" size="sm" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}

      {categorizeTarget && (
        <QuickCategorizeModal
          message={categorizeTarget}
          existingCategories={categoryNames}
          onClose={() => setCategorizeTarget(null)}
          onCreate={handleCreateRule}
        />
      )}
    </div>
  );
}

function CategoryTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1 text-sm transition-colors",
        active ? "bg-moss-600 text-parchment-50" : "bg-canopy-800/6 text-charcoal-600 hover:bg-canopy-800/12"
      )}
    >
      {children}
    </button>
  );
}
