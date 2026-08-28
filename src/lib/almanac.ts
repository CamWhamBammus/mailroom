// Almanac is a separate app/process in the same local "cabin" — reached
// over plain HTTP on its own port, same as any other localhost service.
// No shared code, no shared database: this is the only coupling point
// between the two apps, and it's just their public API.
const ALMANAC_URL = "http://localhost:3001";

class AlmanacUnreachableError extends Error {
  constructor() {
    super("Couldn't reach Almanac. Make sure it's running (The Lodge → Almanac → Launch).");
  }
}

async function postToAlmanac(path: string, body: unknown): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(`${ALMANAC_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    throw new AlmanacUnreachableError();
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Almanac rejected the request (${res.status}).`);
  }
  return res.json();
}

export function createAlmanacTask(data: { title: string; notes?: string; dueDate?: string | null }) {
  return postToAlmanac("/api/tasks", data);
}

export function createAlmanacEvent(data: {
  title: string;
  notes?: string;
  date: string;
  startTime?: string;
  endTime?: string;
}) {
  return postToAlmanac("/api/events", data);
}

export const ALMANAC_APP_URL = ALMANAC_URL;
