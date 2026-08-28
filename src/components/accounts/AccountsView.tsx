"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function AccountsView({ initialAccounts }: { initialAccounts: string[] }) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [removing, setRemoving] = useState<string | null>(null);

  async function handleDisconnect(email: string) {
    if (!confirm(`Disconnect ${email}? Mailroom will stop showing mail from this account until you reconnect it.`)) {
      return;
    }
    setRemoving(email);
    try {
      await fetch(`/api/accounts/${encodeURIComponent(email)}`, { method: "DELETE" });
      setAccounts((prev) => prev.filter((a) => a !== email));
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-canopy-900">Accounts</h1>
          <p className="mt-1 text-sm text-charcoal-600">
            Every account here is merged into one Inbox, sorted by the same rules.
          </p>
        </div>
        <Link href="/api/auth/login">
          <Button size="sm">
            <Plus size={14} />
            Add account
          </Button>
        </Link>
      </div>

      <div className="mt-6 rounded-lg border border-walnut-500/15 bg-parchment-paper shadow-soft">
        {accounts.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-charcoal-600/50">No accounts connected.</p>
        ) : (
          accounts.map((email) => (
            <div
              key={email}
              className="flex items-center gap-3 border-b border-walnut-500/8 px-4 py-3 text-sm last:border-b-0"
            >
              <Mail size={15} className="shrink-0 text-moss-600" />
              <span className="min-w-0 flex-1 truncate text-charcoal-800">{email}</span>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDisconnect(email)}
                disabled={removing === email}
              >
                <Trash2 size={13} />
                {removing === email ? "Disconnecting…" : "Disconnect"}
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
