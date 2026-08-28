import fs from "node:fs";
import { Auth } from "googleapis";
import { ensureDataDir, ACCOUNTS_PATH, LEGACY_TOKENS_PATH } from "./paths";

// Imported through googleapis's own re-export (not the top-level
// google-auth-library package) so this OAuth2Client is structurally the
// exact type google.gmail({ auth }) expects — googleapis bundles its own
// internal copy of google-auth-library, and a separately-installed copy
// has a different (incompatible) private OAuth2Client type despite
// identical public APIs.
const { OAuth2Client } = Auth;
type OAuth2Client = InstanceType<typeof OAuth2Client>;
type Credentials = Auth.Credentials;

// Least-privilege scopes only: read the inbox, send mail, and read the
// connected address for display. Nothing here can archive, delete, or
// modify existing mail — that's a deliberate choice, not an oversight
// (see the Access Level decision this app was built against).
export const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/userinfo.email",
];

interface StoredAccount {
  email: string;
  tokens: Credentials;
}

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. Copy .env.example to .env.local and fill in your Google OAuth client credentials.`
    );
  }
  return value;
}

export function createOAuth2Client(): OAuth2Client {
  return new OAuth2Client(
    getEnv("GOOGLE_CLIENT_ID"),
    getEnv("GOOGLE_CLIENT_SECRET"),
    getEnv("GOOGLE_REDIRECT_URI")
  );
}

export function getAuthUrl(state: string): string {
  const client = createOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    // Forces Google to hand back a refresh_token every time, not just on
    // the very first consent, and forces the account chooser so adding a
    // second/third account doesn't silently re-auth whichever account is
    // already signed into the browser.
    prompt: "consent select_account",
    scope: SCOPES,
    state,
  });
}

/**
 * One-time migration from the original single-account tokens.json into
 * the multi-account accounts.json format. Only runs if accounts.json
 * doesn't exist yet and a legacy file does; deletes the legacy file after
 * a successful migration so a sensitive refresh token doesn't linger in
 * two places on disk.
 */
function migrateLegacyTokensIfNeeded() {
  if (fs.existsSync(ACCOUNTS_PATH) || !fs.existsSync(LEGACY_TOKENS_PATH)) return;
  try {
    const legacy = JSON.parse(fs.readFileSync(LEGACY_TOKENS_PATH, "utf-8"));
    if (legacy?.refresh_token && legacy?.email) {
      const { email, ...tokens } = legacy;
      writeAccounts([{ email, tokens }]);
      fs.unlinkSync(LEGACY_TOKENS_PATH);
    }
  } catch {
    // Corrupt legacy file — ignore, user just reconnects.
  }
}

function readAccounts(): StoredAccount[] {
  migrateLegacyTokensIfNeeded();
  if (!fs.existsSync(ACCOUNTS_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(ACCOUNTS_PATH, "utf-8")).accounts ?? [];
  } catch {
    return [];
  }
}

function writeAccounts(accounts: StoredAccount[]) {
  ensureDataDir();
  fs.writeFileSync(ACCOUNTS_PATH, JSON.stringify({ accounts }, null, 2), "utf-8");
  // Refresh tokens grant ongoing read/send access to real inboxes — keep
  // the file readable only by the current user.
  fs.chmodSync(ACCOUNTS_PATH, 0o600);
}

export function listAccountEmails(): string[] {
  return readAccounts().map((a) => a.email);
}

export function hasAnyAccount(): boolean {
  return readAccounts().length > 0;
}

export function hasAccount(email: string): boolean {
  return readAccounts().some((a) => a.email === email);
}

export function removeAccount(email: string): boolean {
  const accounts = readAccounts();
  const next = accounts.filter((a) => a.email !== email);
  if (next.length === accounts.length) return false;
  writeAccounts(next);
  return true;
}

function upsertAccount(email: string, tokens: Credentials) {
  const accounts = readAccounts();
  const idx = accounts.findIndex((a) => a.email === email);
  if (idx === -1) {
    accounts.push({ email, tokens });
  } else {
    accounts[idx] = { email, tokens: { ...accounts[idx].tokens, ...tokens } };
  }
  writeAccounts(accounts);
}

/** Exchanges an OAuth code for tokens, discovers which address it's for, and stores/updates that account. Returns the connected email. */
export async function exchangeCodeForTokens(code: string): Promise<string> {
  const client = createOAuth2Client();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  const res = await client.request<{ email?: string }>({
    url: "https://www.googleapis.com/oauth2/v2/userinfo",
  });
  const email = res.data.email;
  if (!email) {
    throw new Error("Google didn't return an email address for this account.");
  }

  upsertAccount(email, tokens);
  return email;
}

/**
 * An OAuth2Client pre-loaded with one account's stored credentials,
 * auto-persisting any refreshed access token back to that account's entry
 * so the next request reuses it instead of round-tripping the refresh
 * flow every time.
 */
export function getAuthenticatedClient(email: string): OAuth2Client {
  const account = readAccounts().find((a) => a.email === email);
  if (!account?.tokens.refresh_token) {
    throw new Error(`Not connected to ${email}.`);
  }

  const client = createOAuth2Client();
  client.setCredentials(account.tokens);

  client.on("tokens", (refreshed) => {
    upsertAccount(email, refreshed);
  });

  return client;
}
