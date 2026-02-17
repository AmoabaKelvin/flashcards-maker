export interface FlashcardData {
  id: number;
  front: string;
  back: string;
  frontLabel?: string;
  backLabel?: string;
}

const LABEL_PREFIXES = ["Term", "Process", "Concept", "Definition", "Purpose"];

function extractLabel(text: string): { label?: string; content: string } {
  for (const prefix of LABEL_PREFIXES) {
    if (text.startsWith(`${prefix}: `)) {
      return {
        label: prefix,
        content: text.slice(prefix.length + 2),
      };
    }
  }
  return { content: text };
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);

  return fields;
}

export function parseCSV(text: string): FlashcardData[] {
  const lines = text.split("\n").filter((line) => line.trim());
  const cards: FlashcardData[] = [];

  // Detect and skip header row
  if (lines.length > 0) {
    const firstLine = lines[0].toLowerCase().trim();
    if (
      firstLine.startsWith("question,") ||
      firstLine.startsWith("front,") ||
      firstLine.startsWith('"question",') ||
      firstLine.startsWith('"front",')
    ) {
      lines.shift();
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const fields = parseCSVLine(line);
    if (fields.length < 2) continue;

    const rawFront = fields[0].trim();
    const rawBack = fields
      .slice(1)
      .map((f) => f.trim())
      .filter(Boolean)
      .join(", ");

    if (!rawFront || !rawBack) continue;

    const front = extractLabel(rawFront);
    const back = extractLabel(rawBack);

    cards.push({
      id: i + 1,
      front: front.content,
      back: back.content,
      frontLabel: front.label,
      backLabel: back.label,
    });
  }

  return cards;
}

export function shuffleCards(cards: FlashcardData[]): FlashcardData[] {
  const arr = [...cards];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
