"use client";

import { useState, useCallback, useEffect, useTransition } from "react";
import { parseCSV, shuffleCards, type FlashcardData } from "@/lib/csv-parser";
import { loadSession, clearSession, type CardRating } from "@/lib/session";
import { saveDeck, updateLastStudied } from "@/lib/deck-library";
import { shareDeck } from "@/app/actions";
import { UploadZone } from "@/components/upload-zone";
import { GenerateMode } from "@/components/generate-mode";
import { DeckLibrary } from "@/components/deck-library";
import { StudyMode } from "@/components/study-mode";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  PlayIcon,
  ShuffleIcon,
  Upload04Icon,
  Layers01Icon,
  Share08Icon,
  Tick02Icon,
  LinkSquare02Icon,
  PlayCircleIcon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

type AppView = "upload" | "preview" | "study";
type UploadTab = "csv" | "generate";

interface SharedDeck {
  name: string;
  csvContent: string;
}

interface FlashcardsAppProps {
  sharedDeck?: SharedDeck;
}

interface ResumeData {
  deckName: string;
  csvContent: string;
  cardOrder: number[];
  currentIndex: number;
  seenCardIds: number[];
  ratings?: Record<number, CardRating>;
  timestamp: number;
}

function formatDeckName(filename: string): string {
  return filename
    .replace(/\.csv$/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function FlashcardsApp({ sharedDeck }: FlashcardsAppProps) {
  const [view, setView] = useState<AppView>(sharedDeck ? "preview" : "upload");
  const [uploadTab, setUploadTab] = useState<UploadTab>("csv");
  const [cards, setCards] = useState<FlashcardData[]>([]);
  const [csvContent, setCsvContent] = useState("");
  const [deckName, setDeckName] = useState("");
  const [studyCards, setStudyCards] = useState<FlashcardData[]>([]);
  const [studyInitialIndex, setStudyInitialIndex] = useState(0);
  const [studyInitialSeen, setStudyInitialSeen] = useState<Set<number>>(
    new Set()
  );
  const [studyInitialRatings, setStudyInitialRatings] = useState<
    Record<number, CardRating>
  >({});

  // Share state
  const [shareState, setShareState] = useState<
    "idle" | "sharing" | "copied" | "error"
  >("idle");
  const [shareUrl, setShareUrl] = useState("");
  const [isPending, startTransition] = useTransition();

  // Resume state
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);

  // Deck library
  const [libraryRefreshKey, setLibraryRefreshKey] = useState(0);

  // Check for resumable session on mount
  useEffect(() => {
    if (sharedDeck) return;
    const session = loadSession();
    if (session) {
      setResumeData(session);
    }
  }, [sharedDeck]);

  // Load shared deck
  useEffect(() => {
    if (sharedDeck) {
      const parsed = parseCSV(sharedDeck.csvContent);
      if (parsed.length > 0) {
        setCards(parsed);
        setCsvContent(sharedDeck.csvContent);
        setDeckName(sharedDeck.name);
        saveDeck(sharedDeck.name, sharedDeck.csvContent, parsed.length);
        setView("preview");
      }
    }
  }, [sharedDeck]);

  const handleFileLoaded = useCallback((content: string, filename: string) => {
    const parsed = parseCSV(content);
    if (parsed.length === 0) return;
    const name = formatDeckName(filename);
    setCards(parsed);
    setCsvContent(content);
    setDeckName(name);
    setShareState("idle");
    setShareUrl("");
    setResumeData(null);
    saveDeck(name, content, parsed.length);
    setLibraryRefreshKey((k) => k + 1);
    setView("preview");
  }, []);

  const handleGeneratedCards = useCallback(
    (generatedCsv: string, name: string) => {
      const parsed = parseCSV(generatedCsv);
      if (parsed.length === 0) return;
      const deckTitle = name
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .slice(0, 60);
      setCards(parsed);
      setCsvContent(generatedCsv);
      setDeckName(deckTitle);
      setShareState("idle");
      setShareUrl("");
      setResumeData(null);
      saveDeck(deckTitle, generatedCsv, parsed.length);
      setLibraryRefreshKey((k) => k + 1);
      setView("preview");
    },
    []
  );

  const handleResume = useCallback(() => {
    if (!resumeData) return;
    const parsed = parseCSV(resumeData.csvContent);
    if (parsed.length === 0) return;

    setCards(parsed);
    setCsvContent(resumeData.csvContent);
    setDeckName(resumeData.deckName);

    const cardMap = new Map(parsed.map((c) => [c.id, c]));
    const orderedCards = resumeData.cardOrder
      .map((id) => cardMap.get(id))
      .filter(Boolean) as FlashcardData[];

    setStudyCards(orderedCards.length > 0 ? orderedCards : parsed);
    setStudyInitialIndex(
      Math.min(
        resumeData.currentIndex,
        (orderedCards.length || parsed.length) - 1
      )
    );
    setStudyInitialSeen(new Set(resumeData.seenCardIds));
    setStudyInitialRatings(resumeData.ratings ?? {});
    saveDeck(resumeData.deckName, resumeData.csvContent, parsed.length);
    updateLastStudied(resumeData.deckName, resumeData.csvContent);
    setLibraryRefreshKey((k) => k + 1);
    setResumeData(null);
    setView("study");
  }, [resumeData]);

  const handleDismissResume = useCallback(() => {
    clearSession();
    setResumeData(null);
  }, []);

  const handleShare = useCallback(() => {
    setShareState("sharing");
    startTransition(async () => {
      const result = await shareDeck(deckName, csvContent, cards.length);
      if ("error" in result) {
        setShareState("error");
        setTimeout(() => setShareState("idle"), 3000);
        return;
      }
      const url = `${window.location.origin}/d/${result.id}`;
      setShareUrl(url);
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        // Clipboard not available
      }
      setShareState("copied");
      setTimeout(() => setShareState("idle"), 4000);
    });
  }, [deckName, csvContent, cards.length]);

  const startStudying = useCallback(
    (shuffle: boolean = false) => {
      const ordered = shuffle ? shuffleCards(cards) : [...cards];
      setStudyCards(ordered);
      setStudyInitialIndex(0);
      setStudyInitialSeen(new Set());
      setStudyInitialRatings({});
      updateLastStudied(deckName, csvContent);
      setLibraryRefreshKey((k) => k + 1);
      setView("study");
    },
    [cards, deckName, csvContent]
  );

  const handleSelectDeck = useCallback(
    (name: string, content: string) => {
      const parsed = parseCSV(content);
      if (parsed.length === 0) return;
      setCards(parsed);
      setCsvContent(content);
      setDeckName(name);
      setShareState("idle");
      setShareUrl("");
      setResumeData(null);
      setView("preview");
    },
    []
  );

  const handleReset = useCallback(() => {
    clearSession();
    setView("upload");
    setCards([]);
    setCsvContent("");
    setDeckName("");
    setStudyCards([]);
    setShareState("idle");
    setShareUrl("");
  }, []);

  if (view === "study" && studyCards.length > 0) {
    return (
      <StudyMode
        cards={studyCards}
        deckName={deckName}
        csvContent={csvContent}
        initialIndex={studyInitialIndex}
        initialSeen={studyInitialSeen}
        initialRatings={studyInitialRatings}
        onExit={() => setView("preview")}
        onShare={handleShare}
        shareState={shareState}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Subtle top gradient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.60_0.13_163/0.06),transparent)]" />
      </div>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-10 animate-fade-in">
          <h1 className="font-display text-4xl sm:text-5xl font-normal tracking-tight text-foreground">
            Flashcards
          </h1>
          <p className="text-muted-foreground text-center max-w-md">
            {view === "upload"
              ? "Create your flashcard deck and start studying."
              : "Your deck is ready to study."}
          </p>
        </div>

        {/* Resume banner */}
        {view === "upload" && resumeData && (
          <div className="w-full max-w-2xl mx-auto mb-8 animate-slide-up">
            <div className="flex items-center gap-4 px-5 py-4 rounded-xl border border-primary/20 bg-primary/[0.03]">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 shrink-0">
                <HugeiconsIcon
                  icon={PlayCircleIcon}
                  size={20}
                  className="text-primary"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {resumeData.deckName}
                </p>
                <p className="text-xs text-muted-foreground">
                  Card {resumeData.currentIndex + 1} of{" "}
                  {resumeData.cardOrder.length} &middot;{" "}
                  {resumeData.seenCardIds.length} seen &middot;{" "}
                  {formatTimeAgo(resumeData.timestamp)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button size="sm" onClick={handleResume} className="gap-1.5">
                  Resume
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismissResume}
                  className="text-muted-foreground"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {view === "upload" && (
          <div className="w-full max-w-2xl mx-auto">
            {/* Tab switcher */}
            <div className="flex items-center justify-center gap-1 mb-8 p-1 rounded-xl bg-muted/50 border border-border/50 w-fit mx-auto">
              <button
                onClick={() => setUploadTab("csv")}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  uploadTab === "csv"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <HugeiconsIcon icon={Upload04Icon} size={15} />
                Upload CSV
              </button>
              <button
                onClick={() => setUploadTab("generate")}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  uploadTab === "generate"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <HugeiconsIcon icon={SparklesIcon} size={15} />
                Generate with AI
              </button>
            </div>

            {uploadTab === "csv" && (
              <UploadZone onFileLoaded={handleFileLoaded} />
            )}
            {uploadTab === "generate" && (
              <GenerateMode onCardsReady={handleGeneratedCards} />
            )}

            <DeckLibrary
              onSelectDeck={handleSelectDeck}
              refreshKey={libraryRefreshKey}
            />
          </div>
        )}

        {view === "preview" && cards.length > 0 && (
          <div className="w-full max-w-xl mx-auto animate-slide-up">
            {/* Deck card stack preview */}
            <div className="relative flex justify-center mb-8">
              <div className="relative w-64 h-40">
                {[2, 1, 0].map((i) => (
                  <div
                    key={i}
                    className="absolute inset-0 rounded-xl border border-border bg-card shadow-sm"
                    style={{
                      transform: `rotate(${(i - 1) * 2.5}deg) translateY(${i * -3}px)`,
                      zIndex: 3 - i,
                      opacity: 1 - i * 0.08,
                    }}
                  >
                    {i === 0 && (
                      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {cards[0].front}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Deck info */}
            <div className="flex flex-col items-center gap-6">
              <div className="flex flex-col items-center gap-2">
                <h2 className="text-xl font-semibold text-foreground">
                  {deckName}
                </h2>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <HugeiconsIcon icon={Layers01Icon} size={12} />
                    {cards.length} cards
                  </Badge>
                </div>
              </div>

              {/* Preview list */}
              <div className="w-full rounded-xl border border-border bg-card/50 overflow-hidden">
                {cards.slice(0, 4).map((card, i) => (
                  <div
                    key={card.id}
                    className="flex items-center gap-3 px-4 py-3 text-sm border-b border-border/50 last:border-b-0"
                  >
                    <span className="shrink-0 w-6 h-6 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground font-mono">
                      {i + 1}
                    </span>
                    <span className="truncate text-foreground">
                      {card.front}
                    </span>
                  </div>
                ))}
                {cards.length > 4 && (
                  <div className="px-4 py-2.5 text-xs text-muted-foreground text-center bg-muted/30">
                    and {cards.length - 4} more cards...
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button
                  size="lg"
                  onClick={() => startStudying(false)}
                  className="gap-2 px-6"
                >
                  <HugeiconsIcon
                    icon={PlayIcon}
                    size={16}
                    data-icon="inline-start"
                  />
                  Start studying
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => startStudying(true)}
                  className="gap-2 px-6"
                >
                  <HugeiconsIcon
                    icon={ShuffleIcon}
                    size={16}
                    data-icon="inline-start"
                  />
                  Shuffle & start
                </Button>
              </div>

              {/* Share + Upload different */}
              <div className="flex flex-col items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  disabled={isPending || shareState === "sharing"}
                  className="gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  {shareState === "copied" ? (
                    <>
                      <HugeiconsIcon icon={Tick02Icon} size={14} />
                      Link copied!
                    </>
                  ) : shareState === "sharing" ? (
                    <>
                      <HugeiconsIcon
                        icon={Share08Icon}
                        size={14}
                        className="animate-pulse"
                      />
                      Sharing...
                    </>
                  ) : shareState === "error" ? (
                    "Failed to share. Try again."
                  ) : (
                    <>
                      <HugeiconsIcon icon={Share08Icon} size={14} />
                      Share deck
                    </>
                  )}
                </Button>

                {shareUrl && shareState === "copied" && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border/50 animate-fade-in">
                    <HugeiconsIcon
                      icon={LinkSquare02Icon}
                      size={12}
                      className="text-muted-foreground shrink-0"
                    />
                    <span className="text-xs text-muted-foreground font-mono truncate max-w-[280px]">
                      {shareUrl}
                    </span>
                  </div>
                )}

                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <HugeiconsIcon icon={Upload04Icon} size={14} />
                  Upload a different file
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
