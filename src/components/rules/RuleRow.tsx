"use client";

import { Trash2 } from "lucide-react";
import { MATCH_TYPE_LABELS } from "@/lib/categoryLabels";
import type { CategoryRule } from "@/types";

export function RuleRow({ rule, onDelete }: { rule: CategoryRule; onDelete: () => void }) {
  return (
    <div className="group flex items-center gap-3 border-b border-walnut-500/8 px-4 py-3 text-sm last:border-b-0">
      <span
        className="shrink-0 rounded px-2 py-0.5 text-xs font-medium"
        style={{ backgroundColor: `${rule.color}1f`, color: rule.color }}
      >
        {rule.name}
      </span>
      <span className="min-w-0 flex-1 truncate text-charcoal-600">
        {MATCH_TYPE_LABELS[rule.matchType]} <span className="text-charcoal-800">&ldquo;{rule.value}&rdquo;</span>
      </span>
      <button
        onClick={onDelete}
        aria-label={`Delete rule ${rule.name}`}
        className="shrink-0 rounded p-1 text-charcoal-600/40 opacity-0 transition-opacity hover:bg-clay-500/10 hover:text-clay-500 group-hover:opacity-100"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
