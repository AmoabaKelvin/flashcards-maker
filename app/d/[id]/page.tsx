import type { Metadata } from "next";
import { loadDeck } from "@/app/actions";
import { parseCSV } from "@/lib/csv-parser";
import { FlashcardsApp } from "@/components/flashcards-app";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const deck = await loadDeck(id);

  if (!deck) {
    return { title: "Deck not found" };
  }

  const cardCount = parseCSV(deck.csvContent).length;

  return {
    title: deck.name,
    description: `Study ${cardCount} flashcards in "${deck.name}". Shared via Flashcards.`,
    openGraph: {
      title: deck.name,
      description: `Study ${cardCount} flashcards in "${deck.name}"`,
    },
    twitter: {
      card: "summary_large_image",
      title: deck.name,
      description: `Study ${cardCount} flashcards in "${deck.name}"`,
    },
  };
}

export default async function SharedDeckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deck = await loadDeck(id);

  if (!deck) {
    notFound();
  }

  return (
    <FlashcardsApp
      sharedDeck={{
        name: deck.name,
        csvContent: deck.csvContent,
      }}
    />
  );
}
