"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { TextInput, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { MATCH_TYPE_LABELS } from "@/lib/categoryLabels";
import type { MatchType } from "@/types";

const MATCH_TYPES = Object.keys(MATCH_TYPE_LABELS) as MatchType[];

export function AddRuleForm({
  onAdd,
}: {
  onAdd: (data: { name: string; matchType: MatchType; value: string }) => Promise<void> | void;
}) {
  const [name, setName] = useState("");
  const [matchType, setMatchType] = useState<MatchType>("from-domain");
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !value.trim()) return;
    setSubmitting(true);
    try {
      await onAdd({ name: name.trim(), matchType, value: value.trim() });
      setName("");
      setValue("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-2 rounded-lg border border-walnut-500/15 bg-parchment-paper p-3 shadow-soft"
    >
      <div className="min-w-[140px] flex-1">
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" className="h-9" />
      </div>
      <Select value={matchType} onChange={(e) => setMatchType(e.target.value as MatchType)} className="h-9 w-48">
        {MATCH_TYPES.map((t) => (
          <option key={t} value={t}>
            {MATCH_TYPE_LABELS[t]}
          </option>
        ))}
      </Select>
      <div className="min-w-[140px] flex-1">
        <TextInput
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={matchType === "from-domain" ? "example.com" : "keyword"}
          className="h-9"
        />
      </div>
      <Button type="submit" size="sm" disabled={submitting || !name.trim() || !value.trim()}>
        <Plus size={14} />
        Add rule
      </Button>
    </form>
  );
}
