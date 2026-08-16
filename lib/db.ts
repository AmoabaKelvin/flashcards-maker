import { createClient } from "@libsql/client/web";

// https:// forces the HTTP transport and the fetch wrapper defers to the
// runtime global: the webpack build statically resolves the client's default
// fetch (and its libsql:// WebSocket transport) to Node polyfills that crash
// on workerd, while the runtime global is the platform-native fetch.
const db = createClient({
  url: process.env.TURSO_DATABASE_URL!.replace(/^libsql:\/\//, "https://"),
  authToken: process.env.TURSO_AUTH_TOKEN!,
  fetch: (input: RequestInfo | URL, init?: RequestInit) => globalThis.fetch(input, init),
});

export async function initDB() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS decks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      csv_content TEXT NOT NULL,
      card_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
}

export default db;
