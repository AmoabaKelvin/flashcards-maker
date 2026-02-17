"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { FlashcardData } from "@/lib/csv-parser";
import { shuffleCards } from "@/lib/csv-parser";
import { saveSession, clearSession, type StudySession } from "@/lib/session";
import { Flashcard } from "@/components/flashcard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ShuffleIcon,
  ArrowTurnBackwardIcon,
  Tick02Icon,
  Share08Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface StudyModeProps {
  cards: FlashcardData[];
  deckName: string;
  csvContent: string;
  initialIndex?: number;
  initialSeen?: Set<number>;
  onExit: () => void;
  onShare?: () => void;
  shareState?: "idle" | "sharing" | "copied" | "error";
}

export function StudyMode({
  cards,
  deckName,
  csvContent,
  initialIndex = 0,
  initialSeen,
  onExit,
  onShare,
  shareState = "idle",
}: StudyModeProps) {
  const [currentCards, setCurrentCards] = useState(cards);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFlipped, setIsFlipped] = useState(false);
  const [seenCards, setSeenCards] = useState<Set<number>>(
    initialSeen ?? new Set()
  );
  const [animationKey, setAnimationKey] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const currentCard = currentCards[currentIndex];
  const progress = ((currentIndex + 1) / currentCards.length) * 100;
  const seenCount = seenCards.size;

  // Persist session to localStorage on progress changes
  useEffect(() => {
    if (isComplete) return;
    const session: StudySession = {
      deckName,
      csvContent,
      cardOrder: currentCards.map((c) => c.id),
      currentIndex,
      seenCardIds: Array.from(seenCards),
      timestamp: Date.now(),
    };
    saveSession(session);
  }, [currentCards, currentIndex, seenCards, deckName, csvContent, isComplete]);

  const flipCard = useCallback(() => {
    setIsFlipped((prev) => {
      if (!prev) {
        setSeenCards((s) => new Set(s).add(currentCards[currentIndex].id));
      }
      return !prev;
    });
  }, [currentCards, currentIndex]);

  const goToNext = useCallback(() => {
    if (currentIndex < currentCards.length - 1) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
      setAnimationKey((prev) => prev + 1);
    } else if (seenCards.size >= currentCards.length) {
      setIsComplete(true);
      clearSession();
    }
  }, [currentIndex, currentCards.length, seenCards.size]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev - 1);
      setAnimationKey((prev) => prev + 1);
    }
  }, [currentIndex]);

  const handleShuffle = useCallback(() => {
    setCurrentCards(shuffleCards(currentCards));
    setCurrentIndex(0);
    setIsFlipped(false);
    setAnimationKey((prev) => prev + 1);
  }, [currentCards]);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setSeenCards(new Set());
    setIsComplete(false);
    setAnimationKey((prev) => prev + 1);
  }, []);

  const handleExit = useCallback(() => {
    onExit();
  }, [onExit]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          goToPrevious();
          break;
        case "ArrowRight":
          e.preventDefault();
          goToNext();
          break;
        case " ":
        case "Enter":
          e.preventDefault();
          flipCard();
          break;
        case "Escape":
          e.preventDefault();
          handleExit();
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [flipCard, goToNext, goToPrevious, handleExit]);

  if (isComplete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 animate-fade-in">
        <div className="flex flex-col items-center gap-6 max-w-md text-center">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
            <HugeiconsIcon icon={Tick02Icon} size={36} className="text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="font-display text-3xl font-normal text-foreground">
              Well done!
            </h2>
            <p className="text-muted-foreground">
              You&apos;ve reviewed all {currentCards.length} cards in{" "}
              <span className="font-medium text-foreground">{deckName}</span>.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              onClick={handleRestart}
              className="gap-2"
            >
              <HugeiconsIcon
                icon={ArrowTurnBackwardIcon}
                size={16}
                data-icon="inline-start"
              />
              Study again
            </Button>
            <Button size="lg" onClick={handleExit} className="gap-2">
              Back to deck
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-muted z-50">
        <div
          className="h-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Top bar */}
      <header className="flex items-center justify-between px-4 sm:px-8 pt-6 pb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExit}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={16}
            data-icon="inline-start"
          />
          <span className="hidden sm:inline">Back</span>
        </Button>

        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="font-mono tabular-nums">
            {currentIndex + 1} / {currentCards.length}
          </Badge>
          <Badge
            variant="outline"
            className="hidden sm:inline-flex text-muted-foreground"
          >
            {seenCount} seen
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          {onShare && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onShare}
              disabled={shareState === "sharing"}
              title={shareState === "copied" ? "Link copied!" : "Share deck"}
              className={cn(
                "text-muted-foreground hover:text-foreground",
                shareState === "copied" && "text-primary"
              )}
            >
              {shareState === "copied" ? (
                <HugeiconsIcon icon={Tick02Icon} size={16} />
              ) : (
                <HugeiconsIcon icon={Share08Icon} size={16} />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleShuffle}
            title="Shuffle cards"
            className="text-muted-foreground hover:text-foreground"
          >
            <HugeiconsIcon icon={ShuffleIcon} size={16} />
          </Button>
        </div>
      </header>

      {/* Card area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 pb-32">
        <div key={animationKey} className="w-full animate-card-in">
          <Flashcard
            card={currentCard}
            isFlipped={isFlipped}
            onFlip={flipCard}
          />
        </div>
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 pb-6 pt-4 px-4 sm:px-8 bg-gradient-to-t from-background via-background to-transparent">
        <div className="max-w-2xl mx-auto flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              aria-label="Previous card"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
            </Button>

            <Button
              variant="default"
              size="lg"
              onClick={flipCard}
              className="px-8 gap-2"
            >
              {isFlipped ? "Show question" : "Reveal answer"}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={goToNext}
              disabled={currentIndex === currentCards.length - 1}
              aria-label="Next card"
            >
              <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
            </Button>
          </div>

          {/* Keyboard hints */}
          <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground/50">
            <span className="flex items-center gap-1.5">
              <kbd
                className={cn(
                  "inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded",
                  "bg-muted/80 border border-border/50 font-mono text-[10px]"
                )}
              >
                &larr;
              </kbd>
              <kbd
                className={cn(
                  "inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded",
                  "bg-muted/80 border border-border/50 font-mono text-[10px]"
                )}
              >
                &rarr;
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1.5">
              <kbd
                className={cn(
                  "inline-flex items-center justify-center h-5 min-w-[3rem] px-1.5 rounded",
                  "bg-muted/80 border border-border/50 font-mono text-[10px]"
                )}
              >
                Space
              </kbd>
              Flip
            </span>
            <span className="flex items-center gap-1.5">
              <kbd
                className={cn(
                  "inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded",
                  "bg-muted/80 border border-border/50 font-mono text-[10px]"
                )}
              >
                Esc
              </kbd>
              Exit
            </span>
          </div>
        </div>
      </nav>
    </div>
  );
}
