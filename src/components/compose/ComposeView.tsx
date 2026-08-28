"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { api } from "@/lib/api-client";
import { Field, TextInput, Textarea, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function ComposeView({
  accounts,
  initialFrom,
  initialTo,
  initialSubject,
  threadId,
  inReplyTo,
}: {
  accounts: string[];
  initialFrom: string;
  initialTo: string;
  initialSubject: string;
  threadId?: string;
  inReplyTo?: string;
}) {
  const router = useRouter();
  const [from, setFrom] = useState(initialFrom || accounts[0] || "");
  const [to, setTo] = useState(initialTo);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      await api.send({
        from,
        to,
        subject,
        body,
        threadId,
        inReplyTo,
        references: inReplyTo,
      });
      setSent(true);
      setTimeout(() => router.push("/"), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <h1 className="font-serif text-3xl text-canopy-900">Compose</h1>
      <p className="mt-1 text-sm text-charcoal-600">Sends from whichever account you pick below.</p>

      <form onSubmit={handleSend} className="mt-6 flex flex-col gap-4 rounded-lg border border-walnut-500/15 bg-parchment-paper p-5 shadow-soft">
        {accounts.length > 1 ? (
          <Field label="From" required>
            <Select value={from} onChange={(e) => setFrom(e.target.value)}>
              {accounts.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <p className="text-xs text-charcoal-600/60">From: {from}</p>
        )}
        <Field label="To" required>
          <TextInput
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="someone@example.com"
            required
          />
        </Field>
        <Field label="Subject" required>
          <TextInput value={subject} onChange={(e) => setSubject(e.target.value)} required />
        </Field>
        <Field label="Message" required>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={12} required />
        </Field>

        {error && <p className="text-sm text-clay-500">{error}</p>}
        {sent && <p className="text-sm text-moss-600">Sent.</p>}

        <div className="flex justify-end">
          <Button type="submit" disabled={sending || sent || !from}>
            <Send size={14} />
            {sending ? "Sending…" : "Send"}
          </Button>
        </div>
      </form>
    </div>
  );
}
