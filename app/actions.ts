"use server";

import db, { initDB } from "@/lib/db";

function generateId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

export async function shareDeck(
  name: string,
  csvContent: string,
  cardCount: number
): Promise<{ id: string } | { error: string }> {
  try {
    await initDB();

    const id = generateId();

    await db.execute({
      sql: "INSERT INTO decks (id, name, csv_content, card_count) VALUES (?, ?, ?, ?)",
      args: [id, name, csvContent, cardCount],
    });

    return { id };
  } catch (e) {
    console.error("Failed to share deck:", e);
    return { error: "Failed to share deck. Please try again." };
  }
}

export async function loadDeck(
  id: string
): Promise<{ name: string; csvContent: string } | null> {
  try {
    await initDB();

    const result = await db.execute({
      sql: "SELECT name, csv_content FROM decks WHERE id = ?",
      args: [id],
    });

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      name: row.name as string,
      csvContent: row.csv_content as string,
    };
  } catch (e) {
    console.error("Failed to load deck:", e);
    return null;
  }
}
