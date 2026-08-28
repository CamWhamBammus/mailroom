import os from "node:os";
import path from "node:path";
import fs from "node:fs";

export const APP_DATA_DIR = path.join(os.homedir(), "Library", "Application Support", "Mailroom");
export const ACCOUNTS_PATH = path.join(APP_DATA_DIR, "accounts.json");
// Superseded by ACCOUNTS_PATH (single-account -> multi-account migration) — see googleAuth.ts.
export const LEGACY_TOKENS_PATH = path.join(APP_DATA_DIR, "tokens.json");
export const RULES_PATH = path.join(APP_DATA_DIR, "rules.json");

export function ensureDataDir() {
  fs.mkdirSync(APP_DATA_DIR, { recursive: true });
}
