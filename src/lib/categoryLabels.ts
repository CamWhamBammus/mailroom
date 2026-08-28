import type { MatchType } from "@/types";

// Pure constants only — no Node imports — so client components (like the
// rules form) can import this without pulling lib/categories.ts's
// fs-based storage code into the browser bundle.
export const MATCH_TYPE_LABELS: Record<MatchType, string> = {
  "from-domain": "Sender's domain is",
  "from-contains": "Sender contains",
  "subject-contains": "Subject contains",
  "snippet-contains": "Preview text contains",
};

export const RULE_COLORS = ["#4c6b45", "#7a5738", "#a35d3f", "#b1803a", "#7c7442", "#61804f"];
