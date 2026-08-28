"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Field, TextInput, Textarea, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api-client";
import type { MessageDetail } from "@/types";

type SendType = "task" | "event";

/**
 * Mirrors Almanac's own dateKeyToDate() + toISOString() pattern exactly.
 * `new Date("2026-08-15")` parses as UTC midnight, which local-timezone
 * getters (what Almanac's toDateKey() reads with) can then read back as
 * the *previous* day — the classic date-only-string off-by-one bug.
 * Building the Date from local year/month/day components first avoids it.
 */
function dateInputToISO(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toISOString();
}

export function SendToAlmanacModal({ message, onClose }: { message: MessageDetail; onClose: () => void }) {
  const [type, setType] = useState<SendType>("task");
  const [title, setTitle] = useState(message.subject);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [notes, setNotes] = useState(`From: ${message.from} <${message.fromEmail}>`);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setError(null);
    setSaving(true);
    try {
      if (type === "task") {
        await api.sendToAlmanacTask({
          title: title.trim(),
          notes,
          dueDate: date ? dateInputToISO(date) : null,
        });
      } else {
        if (!date) {
          setError("Pick a date for the event.");
          setSaving(false);
          return;
        }
        await api.sendToAlmanacEvent({
          title: title.trim(),
          notes,
          date: dateInputToISO(date),
          startTime: startTime || undefined,
        });
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send to Almanac");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <Modal open onClose={onClose} title="Sent to Almanac">
        <p className="text-sm text-charcoal-800">
          {type === "task" ? "Task" : "Event"} created in Almanac.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <a href="http://localhost:3001" target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" size="sm">
              Open Almanac
            </Button>
          </a>
          <Button size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} title="Send to Almanac">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Add as">
          <Select value={type} onChange={(e) => setType(e.target.value as SendType)}>
            <option value="task">Task (with an optional due date)</option>
            <option value="event">Event (on a specific day)</option>
          </Select>
        </Field>

        <Field label="Title" required>
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} required />
        </Field>

        <Field label={type === "task" ? "Due date" : "Date"} required={type === "event"}>
          <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} required={type === "event"} />
        </Field>

        {type === "event" && (
          <Field label="Time" hint="Optional">
            <TextInput type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </Field>
        )}

        <Field label="Notes">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </Field>

        {error && <p className="text-sm text-clay-500">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving || !title.trim()}>
            {saving ? "Sending…" : "Send to Almanac"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
