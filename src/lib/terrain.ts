import type { MessageSummary } from "@/types";

export interface CategorySlice {
  name: string;
  color: string;
  count: number;
}

const UNCATEGORIZED_COLOR = "#7a7264";

/** Category volume, largest first — "Uncategorized" included as its own slice. */
export function buildCategoryBreakdown(messages: MessageSummary[]): CategorySlice[] {
  const map = new Map<string, { color: string; count: number }>();
  for (const m of messages) {
    const name = m.category ?? "Uncategorized";
    const color = m.categoryColor ?? UNCATEGORIZED_COLOR;
    const existing = map.get(name);
    if (existing) existing.count += 1;
    else map.set(name, { color, count: 1 });
  }
  return [...map.entries()]
    .map(([name, v]) => ({ name, color: v.color, count: v.count }))
    .sort((a, b) => b.count - a.count);
}

export interface DayActivity {
  dateKey: string;
  count: number;
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Message volume per local calendar day, oldest first. */
export function buildDailyActivity(messages: MessageSummary[]): DayActivity[] {
  const map = new Map<string, number>();
  for (const m of messages) {
    if (!m.date) continue;
    const key = toDateKey(new Date(m.date));
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([dateKey, count]) => ({ dateKey, count }))
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}

export interface TreemapRect extends CategorySlice {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Binary slice-and-dice treemap: recursively splits the item list at the
 * midpoint-by-value and cuts the rectangle along its longer axis. Not the
 * fully optimal "squarified" algorithm (which reorders items to minimize
 * aspect ratio), but with ~8 categories of varied size it produces
 * reasonably proportioned rectangles at a fraction of the code.
 */
export function layoutTreemap(items: CategorySlice[], x: number, y: number, width: number, height: number): TreemapRect[] {
  if (items.length === 0) return [];
  if (items.length === 1) {
    return [{ ...items[0], x, y, width, height }];
  }

  const total = items.reduce((sum, i) => sum + i.count, 0);
  let acc = 0;
  let splitIndex = 1;
  for (let i = 0; i < items.length; i++) {
    acc += items[i].count;
    if (acc >= total / 2) {
      splitIndex = i + 1;
      break;
    }
  }

  const first = items.slice(0, splitIndex);
  const second = items.slice(splitIndex);
  const firstValue = first.reduce((sum, i) => sum + i.count, 0);
  const firstRatio = total > 0 ? firstValue / total : 0.5;

  if (width >= height) {
    const firstWidth = width * firstRatio;
    return [
      ...layoutTreemap(first, x, y, firstWidth, height),
      ...layoutTreemap(second, x + firstWidth, y, width - firstWidth, height),
    ];
  }
  const firstHeight = height * firstRatio;
  return [
    ...layoutTreemap(first, x, y, width, firstHeight),
    ...layoutTreemap(second, x, y + firstHeight, width, height - firstHeight),
  ];
}
