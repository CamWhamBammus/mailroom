"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import type { DayActivity } from "@/lib/terrain";

const GAP_RATIO = 0.22; // gap as a fraction of cell size, so spacing scales with it
const MIN_CELL = 14;
const MAX_CELL = 40;
const LABEL_WIDTH = 34;
const TOP_MARGIN = 22;
const OPACITIES = [0.06, 0.28, 0.5, 0.72, 0.95];
const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
// Only label every other row (GitHub's convention) — every row would be
// too cramped to read.
const DAY_LABELS: Record<number, string> = { 1: "Mon", 3: "Wed", 5: "Fri" };

interface Cell {
  dateKey: string;
  count: number;
  inRange: boolean;
  isFirstOfMonth: boolean;
}

interface Tooltip {
  left: number;
  top: number;
  label: string;
}

function intensityLevel(count: number, max: number): number {
  if (count === 0 || max === 0) return 0;
  const ratio = count / max;
  if (ratio > 0.75) return 4;
  if (ratio > 0.5) return 3;
  if (ratio > 0.25) return 2;
  return 1;
}

export function ActivityHeatmap({ days }: { days: DayActivity[] }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const [availableWidth, setAvailableWidth] = useState(700);

  // The grid should fill the card like the treemap above it does, rather
  // than sitting at a small fixed size with empty space to the right —
  // but stretching a small viewBox to fit via SVG's own scaling blows the
  // font size up disproportionately (a real bug hit earlier). Measuring
  // the actual container width and computing cell size in real pixels
  // avoids that: 1 SVG unit stays 1 CSS pixel, always.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setAvailableWidth(w);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { weeks, maxCount, totalCount } = useMemo(() => {
    if (days.length === 0) return { weeks: [] as Cell[][], maxCount: 0, totalCount: 0 };

    const byKey = new Map(days.map((d) => [d.dateKey, d.count]));
    const sorted = [...days].sort((a, b) => a.dateKey.localeCompare(b.dateKey));
    const first = new Date(`${sorted[0].dateKey}T00:00:00`);
    const last = new Date(`${sorted[sorted.length - 1].dateKey}T00:00:00`);

    const start = new Date(first);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(last);
    end.setDate(end.getDate() + (6 - end.getDay()));

    const max = Math.max(...days.map((d) => d.count));
    const total = days.reduce((sum, d) => sum + d.count, 0);

    const weeks: Cell[][] = [];
    let week: Cell[] = [];
    const seenMonths = new Set<number>();
    for (let cur = new Date(start); cur <= end; cur.setDate(cur.getDate() + 1)) {
      const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`;
      const isFirstOfMonth = cur.getDate() <= 7 && !seenMonths.has(cur.getMonth());
      if (isFirstOfMonth) seenMonths.add(cur.getMonth());
      week.push({
        dateKey: key,
        count: byKey.get(key) ?? 0,
        inRange: cur >= first && cur <= last,
        isFirstOfMonth,
      });
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }
    if (week.length) weeks.push(week);

    return { weeks, maxCount: max, totalCount: total };
  }, [days]);

  if (weeks.length === 0) {
    return <p className="py-8 text-center text-sm text-charcoal-600/50">No dated messages to show yet.</p>;
  }

  // Solve for the cell size that makes the grid exactly fill
  // availableWidth: LABEL_WIDTH + n*cell + (n-1)*(cell*GAP_RATIO) = availableWidth
  const n = weeks.length;
  const idealCell = (availableWidth - LABEL_WIDTH) / (n + (n - 1) * GAP_RATIO);
  const cell = Math.min(MAX_CELL, Math.max(MIN_CELL, idealCell));
  const gap = cell * GAP_RATIO;
  const step = cell + gap;
  const fontSize = Math.min(15, Math.max(11, cell * 0.55));

  const width = LABEL_WIDTH + n * step;
  const height = TOP_MARGIN + 7 * step;

  function showTooltip(e: React.MouseEvent, day: Cell) {
    const el = wrapperRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setTooltip({
      left: e.clientX - rect.left,
      top: e.clientY - rect.top,
      label: `${format(new Date(`${day.dateKey}T00:00:00`), "EEE, MMM d")} — ${day.count} message${day.count === 1 ? "" : "s"}`,
    });
  }

  return (
    <div>
      <p className="mb-3 text-xs text-charcoal-600/60">
        One square per day, over the {days.length} days covered by the messages above ({totalCount} total). Darker
        = more mail arrived that day. Hover a square for the exact count.
      </p>
      <div ref={wrapperRef} className="relative">
        <svg width={width} height={height} className="block">
          {[1, 3, 5].map((di) => (
            <text key={di} x={0} y={TOP_MARGIN + di * step + cell - cell * 0.2} fontSize={fontSize} fill="var(--charcoal-600)" opacity={0.55}>
              {DAY_LABELS[di]}
            </text>
          ))}
          {weeks.map((week, wi) =>
            week.map((day, di) => {
              const monthLabel =
                day.isFirstOfMonth && di === 0 ? MONTH_LABELS[new Date(`${day.dateKey}T00:00:00`).getMonth()] : null;
              return (
                <g key={day.dateKey}>
                  {monthLabel && (
                    <text x={LABEL_WIDTH + wi * step} y={14} fontSize={fontSize} fill="var(--charcoal-600)" opacity={0.65}>
                      {monthLabel}
                    </text>
                  )}
                  <rect
                    x={LABEL_WIDTH + wi * step}
                    y={TOP_MARGIN + di * step}
                    width={cell}
                    height={cell}
                    rx={cell * 0.2}
                    fill="var(--moss-600)"
                    fillOpacity={day.inRange ? OPACITIES[intensityLevel(day.count, maxCount)] : 0}
                    stroke={day.inRange ? "transparent" : "var(--walnut-500)"}
                    strokeOpacity={0.08}
                    onMouseEnter={day.inRange ? (e) => showTooltip(e, day) : undefined}
                    onMouseLeave={() => setTooltip(null)}
                  />
                </g>
              );
            })
          )}
        </svg>
        {tooltip && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded bg-canopy-950 px-2 py-1 text-xs whitespace-nowrap text-parchment-50 shadow-lifted"
            style={{ left: tooltip.left, top: tooltip.top - 8 }}
          >
            {tooltip.label}
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-sm text-charcoal-600/50">
        Less
        {OPACITIES.map((op) => (
          <span key={op} className="h-4 w-4 rounded" style={{ backgroundColor: "var(--moss-600)", opacity: op || 0.06 }} />
        ))}
        More
      </div>
    </div>
  );
}
