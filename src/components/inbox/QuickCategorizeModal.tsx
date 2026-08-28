"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Field, TextInput, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { MATCH_TYPE_LABELS } from "@/lib/categoryLabels";
import type { MatchType, MessageSummary } from "@/types";

const MATCH_TYPES = Object.keys(MATCH_TYPE_LABELS) as MatchType[];
const NEW_CATEGORY = "__new__";

function domainOf(email: string): string {
  return email.split("@")[1]?.toLowerCase() ?? "";
}

export function QuickCategorizeModal({
  message,
  existingCategories,
  onClose,
  onCreate,
}: {
  message: MessageSummary;
  existingCategories: string[];
  onClose: () => void;
  onCreate: (data: { name: string; matchType: MatchType; value: string }) => Promise<void>;
}) {
  const [categoryChoice, setCategoryChoice] = useState(existingCategories[0] ?? NEW_CATEGORY);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [matchType, setMatchType] = useState<MatchType>("from-domain");
  const [value, setValue] = useState(domainOf(message.fromEmail));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryName = categoryChoice === NEW_CATEGORY ? newCategoryName.trim() : categoryChoice;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryName || !value.trim()) return;
    setError(null);
    setSaving(true);
    try {
      await onCreate({ name: categoryName, matchType, value: value.trim() });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create rule");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Categorize this sender">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-charcoal-600">
          From <span className="font-medium text-charcoal-800">{message.from}</span> &lt;{message.fromEmail}&gt;
        </p>

        <Field label="Category" required>
          <Select value={categoryChoice} onChange={(e) => setCategoryChoice(e.target.value)}>
            {existingCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value={NEW_CATEGORY}>+ New category…</option>
          </Select>
        </Field>

        {categoryChoice === NEW_CATEGORY && (
          <Field label="New category name" required>
            <TextInput
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g. Newsletters"
              autoFocus
              required
            />
          </Field>
        )}

        <Field label="Match" required hint="Applies to every future message that matches this too.">
          <Select value={matchType} onChange={(e) => setMatchType(e.target.value as MatchType)}>
            {MATCH_TYPES.map((t) => (
              <option key={t} value={t}>
                {MATCH_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Value" required>
          <TextInput value={value} onChange={(e) => setValue(e.target.value)} required />
        </Field>

        {error && <p className="text-sm text-clay-500">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving || !categoryName || !value.trim()}>
            {saving ? "Saving…" : "Create rule"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
