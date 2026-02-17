const SESSION_KEY = "flashcards-session";

export interface StudySession {
  deckName: string;
  csvContent: string;
  cardOrder: number[]; // card IDs in study order
  currentIndex: number;
  seenCardIds: number[];
  timestamp: number;
}

export function saveSession(session: StudySession): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Storage full or unavailable - silently fail
  }
}

export function loadSession(): StudySession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StudySession;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // silently fail
  }
}
