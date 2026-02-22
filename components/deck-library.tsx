"use client";

import { useState, useEffect, useCallback } from "react";
import { getDecks, deleteDeck, type SavedDeck } from "@/lib/deck-library";
import { Button } from "@/components/ui/button";
import {
  Layers01Icon,
  Delete02Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface DeckLibraryProps {
  onSelectDeck: (name: string, csvContent: string) => void;
  refreshKey?: number;
}

function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function DeckLibrary({ onSelectDeck, refreshKey }: DeckLibraryProps) {
  const [decks, setDecks] = useState<SavedDeck[]>([]);

  useEffect(() => {
    setDecks(getDecks());
  }, [refreshKey]);

  const handleDelete = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      deleteDeck(id);
      setDecks(getDecks());
    },
    []
  );

  if (decks.length === 0) return null;

  return (
    <div className="w-full mt-10 animate-fade-in">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">
        Your decks
      </h3>
      <div className="rounded-xl border border-border bg-card/50 overflow-hidden divide-y divide-border/50">
        {decks.map((deck) => (
          <div
            key={deck.id}
            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer group"
            onClick={() => onSelectDeck(deck.name, deck.csvContent)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectDeck(deck.name, deck.csvContent);
              }
            }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {deck.name}
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1">
                  <HugeiconsIcon icon={Layers01Icon} size={10} />
                  {deck.cardCount} cards
                </span>
                {deck.lastStudiedAt && (
                  <span className="flex items-center gap-1">
                    <HugeiconsIcon icon={Clock01Icon} size={10} />
                    {formatRelativeTime(deck.lastStudiedAt)}
                  </span>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => handleDelete(e, deck.id)}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all h-8 w-8 p-0"
              aria-label={`Delete ${deck.name}`}
            >
              <HugeiconsIcon icon={Delete02Icon} size={14} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
