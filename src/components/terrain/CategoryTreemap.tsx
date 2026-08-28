"use client";

import { useMemo } from "react";
import { layoutTreemap, type CategorySlice } from "@/lib/terrain";

const WIDTH = 700;
const HEIGHT = 340;

export function CategoryTreemap({ slices }: { slices: CategorySlice[] }) {
  const rects = useMemo(() => layoutTreemap(slices, 0, 0, WIDTH, HEIGHT), [slices]);

  if (rects.length === 0) {
    return <p className="py-8 text-center text-sm text-charcoal-600/50">No messages to show yet.</p>;
  }

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto w-full">
      {rects.map((r) => (
        <g key={r.name}>
          <rect
            x={r.x}
            y={r.y}
            width={r.width}
            height={r.height}
            fill={r.color}
            fillOpacity={0.8}
            stroke="var(--parchment-paper)"
            strokeWidth={2}
            rx={3}
          />
          {r.width > 70 && r.height > 26 && (
            <text x={r.x + 10} y={r.y + 22} fill="white" fontSize={13} fontWeight={600}>
              {r.name}
            </text>
          )}
          {r.width > 70 && r.height > 44 && (
            <text x={r.x + 10} y={r.y + 40} fill="white" fillOpacity={0.85} fontSize={11}>
              {r.count} message{r.count === 1 ? "" : "s"}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
