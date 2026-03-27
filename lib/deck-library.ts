const LIBRARY_KEY = "flashcards-library";

export interface SavedDeck {
  id: string;
  name: string;
  csvContent: string;
  cardCount: number;
  createdAt: number;
  lastStudiedAt: number | null;
}

function generateId(): string {
  return `deck_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadLibrary(): SavedDeck[] {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedDeck[];
  } catch {
    return [];
  }
}

function persistLibrary(decks: SavedDeck[]): boolean {
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(decks));
    return true;
  } catch {
    return false;
  }
}

export function getDecks(): SavedDeck[] {
  return loadLibrary().sort((a, b) => {
    const aTime = a.lastStudiedAt ?? a.createdAt;
    const bTime = b.lastStudiedAt ?? b.createdAt;
    return bTime - aTime;
  });
}

export function saveDeck(
  name: string,
  csvContent: string,
  cardCount: number
): SavedDeck | null {
  const decks = loadLibrary();
  const existing = decks.find(
    (d) => d.name === name && d.csvContent === csvContent
  );
  if (existing) return existing;

  const deck: SavedDeck = {
    id: generateId(),
    name,
    csvContent,
    cardCount,
    createdAt: Date.now(),
    lastStudiedAt: null,
  };
  decks.unshift(deck);
  if (!persistLibrary(decks)) return null;
  return deck;
}

export function deleteDeck(id: string): void {
  const decks = loadLibrary().filter((d) => d.id !== id);
  persistLibrary(decks);
}

export function updateLastStudied(
  name: string,
  csvContent: string
): void {
  const decks = loadLibrary();
  const deck = decks.find(
    (d) => d.name === name && d.csvContent === csvContent
  );
  if (deck) {
    deck.lastStudiedAt = Date.now();
    persistLibrary(decks);
  }
}
