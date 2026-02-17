"use client";

import { cn } from "@/lib/utils";
import type { FlashcardData } from "@/lib/csv-parser";
import { Badge } from "@/components/ui/badge";
import { RichText } from "@/components/rich-text";

interface FlashcardProps {
  card: FlashcardData;
  isFlipped: boolean;
  onFlip: () => void;
}

export function Flashcard({ card, isFlipped, onFlip }: FlashcardProps) {
  return (
    <div
      className="flashcard-perspective w-full max-w-2xl mx-auto cursor-pointer select-none"
      onClick={onFlip}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onFlip();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={isFlipped ? "Click to see question" : "Click to see answer"}
    >
      <div
        className={cn(
          "flashcard-inner relative w-full aspect-[4/3] sm:aspect-[3/2]",
          isFlipped && "is-flipped"
        )}
      >
        {/* Front face - Question */}
        <div className="flashcard-face flashcard-front absolute inset-0 rounded-2xl bg-card border border-border shadow-lg flex flex-col items-center justify-center p-6 sm:p-10 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,oklch(0.60_0.13_163/0.04),transparent_60%)]" />
          <div className="relative flex flex-col items-center gap-4 max-w-full">
            {card.frontLabel && (
              <Badge variant="secondary" className="text-xs font-medium tracking-wide uppercase">
                {card.frontLabel}
              </Badge>
            )}
            <p className="text-base sm:text-lg md:text-xl text-center leading-relaxed text-foreground font-medium">
              <RichText text={card.front} />
            </p>
          </div>
          <span className="absolute bottom-4 text-xs text-muted-foreground/60 tracking-wide">
            Click to reveal
          </span>
        </div>

        {/* Back face - Answer */}
        <div className="flashcard-face flashcard-back absolute inset-0 rounded-2xl border border-primary/20 shadow-lg flex flex-col items-center justify-center p-6 sm:p-10 overflow-hidden bg-gradient-to-br from-primary/[0.06] via-card to-primary/[0.03]">
          <div className="relative flex flex-col items-center gap-4 max-w-full">
            {card.backLabel && (
              <Badge className="text-xs font-medium tracking-wide uppercase">
                {card.backLabel}
              </Badge>
            )}
            <p className="text-base sm:text-lg md:text-xl text-center leading-relaxed text-foreground">
              <RichText text={card.back} />
            </p>
          </div>
          <span className="absolute bottom-4 text-xs text-muted-foreground/60 tracking-wide">
            Click to flip back
          </span>
        </div>
      </div>
    </div>
  );
}
