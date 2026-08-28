import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { ensureDataDir, RULES_PATH } from "./paths";
import { RULE_COLORS } from "./categoryLabels";
import type { CategoryRule, MatchType } from "@/types";

export type { MatchType, CategoryRule };
export { MATCH_TYPE_LABELS, RULE_COLORS } from "./categoryLabels";

function readRules(): CategoryRule[] {
  if (!fs.existsSync(RULES_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(RULES_PATH, "utf-8"));
  } catch {
    return [];
  }
}

function writeRules(rules: CategoryRule[]) {
  ensureDataDir();
  fs.writeFileSync(RULES_PATH, JSON.stringify(rules, null, 2), "utf-8");
}

export function listRules(): CategoryRule[] {
  return readRules().sort((a, b) => a.order - b.order);
}

export function addRule(input: { name: string; matchType: MatchType; value: string; color?: string }): CategoryRule {
  const rules = readRules();
  const rule: CategoryRule = {
    id: randomUUID(),
    name: input.name.trim(),
    matchType: input.matchType,
    value: input.value.trim(),
    color: input.color ?? RULE_COLORS[rules.length % RULE_COLORS.length],
    order: rules.length,
    createdAt: new Date().toISOString(),
  };
  rules.push(rule);
  writeRules(rules);
  return rule;
}

export function updateRule(id: string, patch: Partial<Pick<CategoryRule, "name" | "matchType" | "value" | "color" | "order">>): CategoryRule | null {
  const rules = readRules();
  const idx = rules.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  rules[idx] = { ...rules[idx], ...patch };
  writeRules(rules);
  return rules[idx];
}

export function removeRule(id: string): boolean {
  const rules = readRules();
  const next = rules.filter((r) => r.id !== id);
  if (next.length === rules.length) return false;
  writeRules(next);
  return true;
}

export interface ClassifiableMessage {
  from: string;
  fromEmail: string;
  subject: string;
  snippet: string;
}

/** First matching rule wins, in the user's chosen order. Returns null (Uncategorized) if nothing matches. */
export function classify(message: ClassifiableMessage, rules: CategoryRule[]): CategoryRule | null {
  const from = message.from.toLowerCase();
  const fromEmail = message.fromEmail.toLowerCase();
  const subject = message.subject.toLowerCase();
  const snippet = message.snippet.toLowerCase();

  for (const rule of rules) {
    const value = rule.value.toLowerCase();
    let matched = false;
    switch (rule.matchType) {
      case "from-domain": {
        // Matches the exact domain AND any subdomain of it (mail.example.edu,
        // news.example.edu, etc. all count as "example.edu"). The previous
        // `includes("@value.")` check didn't actually do this — it only matched
        // a literal "." right after the domain, which real addresses don't have.
        const domain = fromEmail.split("@")[1] ?? "";
        matched = domain === value || domain.endsWith(`.${value}`);
        break;
      }
      case "from-contains":
        matched = from.includes(value) || fromEmail.includes(value);
        break;
      case "subject-contains":
        matched = subject.includes(value);
        break;
      case "snippet-contains":
        matched = snippet.includes(value);
        break;
    }
    if (matched) return rule;
  }
  return null;
}
