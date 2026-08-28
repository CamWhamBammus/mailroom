"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { CategoryTreemap } from "@/components/terrain/CategoryTreemap";
import { ActivityHeatmap } from "@/components/terrain/ActivityHeatmap";
import { buildCategoryBreakdown, buildDailyActivity } from "@/lib/terrain";
import type { MessageSummary } from "@/types";

export function TerrainView({ messages }: { messages: MessageSummary[] }) {
  const categories = useMemo(() => buildCategoryBreakdown(messages), [messages]);
  const days = useMemo(() => buildDailyActivity(messages), [messages]);
  const busiest = useMemo(() => [...days].sort((a, b) => b.count - a.count)[0], [days]);

  return (
    <div>
      <h1 className="font-serif text-3xl text-canopy-900">Terrain</h1>
      <p className="mt-1 text-sm text-charcoal-600">The shape of your inbox, at a glance.</p>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <StatCard label="Messages analyzed" value={String(messages.length)} />
        <StatCard
          label="Top category"
          value={categories[0]?.name ?? "—"}
          sub={categories[0] ? `${categories[0].count} messages` : undefined}
        />
        <StatCard
          label="Busiest day"
          value={busiest ? format(new Date(`${busiest.dateKey}T00:00:00`), "MMM d") : "—"}
          sub={busiest ? `${busiest.count} messages` : undefined}
        />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-xs font-medium tracking-wide text-charcoal-600/70 uppercase">By category</h2>
        <div className="rounded-lg border border-walnut-500/15 bg-parchment-paper p-4 shadow-soft">
          <CategoryTreemap slices={categories} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-xs font-medium tracking-wide text-charcoal-600/70 uppercase">Mail volume by day</h2>
        <div className="overflow-x-auto rounded-lg border border-walnut-500/15 bg-parchment-paper p-4 shadow-soft">
          <ActivityHeatmap days={days} />
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-walnut-500/15 bg-parchment-paper p-4 shadow-soft">
      <p className="text-xs font-medium tracking-wide text-charcoal-600/60 uppercase">{label}</p>
      <p className="mt-1 truncate font-serif text-xl text-canopy-900" title={value}>
        {value}
      </p>
      {sub && <p className="text-xs text-charcoal-600/50">{sub}</p>}
    </div>
  );
}
