import { loadDeck } from "@/app/actions";
import { FlashcardsApp } from "@/components/flashcards-app";
import { notFound } from "next/navigation";

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
