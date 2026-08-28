"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";
import { AddRuleForm } from "@/components/rules/AddRuleForm";
import { RuleRow } from "@/components/rules/RuleRow";
import type { CategoryRule, MatchType } from "@/types";

export function RulesView({ initialRules }: { initialRules: CategoryRule[] }) {
  const [rules, setRules] = useState(initialRules);

  async function handleAdd(data: { name: string; matchType: MatchType; value: string }) {
    const { rule } = await api.addRule(data);
    setRules((prev) => [...prev, rule]);
  }

  async function handleDelete(id: string) {
    setRules((prev) => prev.filter((r) => r.id !== id));
    await api.deleteRule(id);
  }

  return (
    <div>
      <h1 className="font-serif text-3xl text-canopy-900">Rules</h1>
      <p className="mt-1 text-sm text-charcoal-600">
        The first matching rule wins, top to bottom. Mail is checked against the sender, subject, and preview
        text — not the full body.
      </p>

      <div className="mt-6">
        <AddRuleForm onAdd={handleAdd} />
      </div>

      <div className="mt-4 rounded-lg border border-walnut-500/15 bg-parchment-paper shadow-soft">
        {rules.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-charcoal-600/50">
            No rules yet — everything shows up as Uncategorized until you add some.
          </p>
        ) : (
          rules.map((rule) => <RuleRow key={rule.id} rule={rule} onDelete={() => handleDelete(rule.id)} />)
        )}
      </div>
    </div>
  );
}
