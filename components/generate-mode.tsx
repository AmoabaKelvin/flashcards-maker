"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { upload } from "@vercel/blob/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RichText } from "@/components/rich-text";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Attachment01Icon,
  SparklesIcon,
  Download04Icon,
  Cancel01Icon,
  ArrowUp02Icon,
  File02Icon,
  Image01Icon,
  PlayIcon,
  Layers01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface GeneratedCard {
  front: string;
  back: string;
}

interface AttachedFile {
  name: string;
  type: string;
  size: number;
  content: string;
  isText: boolean;
  rawFile?: File;
}

interface GenerateConfig {
  cardCount: "fewer" | "standard" | "more";
  difficulty: "easy" | "medium" | "hard";
}

interface GenerateModeProps {
  onCardsReady: (csvContent: string, deckName: string) => void;
}

const TEXT_EXTENSIONS = [
  ".txt",
  ".md",
  ".csv",
  ".json",
  ".html",
  ".htm",
  ".xml",
  ".yaml",
  ".yml",
  ".js",
  ".ts",
  ".py",
  ".java",
  ".c",
  ".cpp",
  ".rb",
  ".go",
  ".rs",
  ".swift",
];

function isTextFile(filename: string): boolean {
  return TEXT_EXTENSIONS.some((ext) =>
    filename.toLowerCase().endsWith(ext)
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function escapeCSVField(field: string): string {
  if (/[,"\r\n]/.test(field)) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

function cardsToCSV(cards: GeneratedCard[]): string {
  return cards
    .map((c) => `${escapeCSVField(c.front)},${escapeCSVField(c.back)}`)
    .join("\n");
}

export function GenerateMode({ onCardsReady }: GenerateModeProps) {
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [config, setConfig] = useState<GenerateConfig>({
    cardCount: "standard",
    difficulty: "medium",
  });
  const [cards, setCards] = useState<GeneratedCard[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleFileSelect = useCallback(
    async (fileList: FileList) => {
      const newFiles: AttachedFile[] = [];

      for (const file of Array.from(fileList)) {
        if (files.length + newFiles.length >= 5) break;

        const isText = isTextFile(file.name) || file.type.startsWith("text/");

        if (isText) {
          const content = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsText(file);
          });
          newFiles.push({
            name: file.name,
            type: file.type || "text/plain",
            size: file.size,
            content,
            isText: true,
          });
        } else {
          newFiles.push({
            name: file.name,
            type: file.type || "application/octet-stream",
            size: file.size,
            content: "",
            isText: false,
            rawFile: file,
          });
        }
      }

      setFiles((prev) => [...prev, ...newFiles]);
    },
    [files.length]
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const toggleCardFlip = useCallback((index: number) => {
    setFlippedCards((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!input.trim() && files.length === 0) return;

    setIsGenerating(true);
    setError("");
    setCards([]);
    setFlippedCards(new Set());

    try {
      // Upload non-text files directly to Vercel Blob (bypasses server body limit)
      const filePayloads = await Promise.all(
        files.map(async (f) => {
          if (f.isText) {
            return { content: f.content, type: f.type, name: f.name, isText: true };
          }
          if (!f.rawFile) {
            throw new Error(`Missing file data for ${f.name}`);
          }
          const blob = await upload(f.rawFile.name, f.rawFile, {
            access: "public",
            handleUploadUrl: "/api/upload",
          });
          return { url: blob.url, type: f.type, name: f.name, isText: false };
        })
      );

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instructions: input,
          files: filePayloads,
          config,
        }),
      });

      if (!response.ok) {
        throw new Error("Generation failed. Please try again.");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if ("error" in parsed) {
              setError(parsed.error);
            } else if (parsed.front && parsed.back) {
              setCards((prev) => [...prev, parsed]);
            }
          } catch {
            // skip unparseable lines
          }
        }
      }

      // Process remaining buffer
      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer.trim());
          if (parsed.front && parsed.back) {
            setCards((prev) => [...prev, parsed]);
          }
        } catch {
          // skip
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setIsGenerating(false);
    }
  }, [input, files, config]);

  const handleDownloadCSV = useCallback(() => {
    const csv = cardsToCSV(cards);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "flashcards.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [cards]);

  const handleStudyCards = useCallback(() => {
    const csv = cardsToCSV(cards);
    const name = input.trim().slice(0, 60) || "AI Generated";
    onCardsReady(csv, name);
  }, [cards, input, onCardsReady]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!isGenerating && (input.trim() || files.length > 0)) {
          handleGenerate();
        }
      }
    },
    [isGenerating, input, files.length, handleGenerate]
  );

  const canGenerate =
    !isGenerating && (input.trim().length > 0 || files.length > 0);

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in">
      {/* Input area */}
      <div
        className={cn(
          "rounded-2xl border bg-card shadow-sm transition-all duration-300",
          isGenerating
            ? "border-primary/30 shadow-[0_0_0_1px_oklch(0.60_0.13_163/0.1)]"
            : "border-border hover:border-border/80"
        )}
      >
        {/* File chips */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 pt-3">
            {files.map((file, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-lg bg-muted/60 border border-border/50 text-xs group"
              >
                <HugeiconsIcon
                  icon={
                    file.type.startsWith("image/")
                      ? Image01Icon
                      : File02Icon
                  }
                  size={12}
                  className="text-muted-foreground shrink-0"
                />
                <span className="truncate max-w-[120px] text-foreground">
                  {file.name}
                </span>
                <span className="text-muted-foreground/60">
                  {formatFileSize(file.size)}
                </span>
                <button
                  onClick={() => removeFile(i)}
                  className="p-0.5 rounded hover:bg-muted-foreground/10 transition-colors"
                >
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    size={12}
                    className="text-muted-foreground"
                  />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            files.length > 0
              ? "Add instructions (optional)... e.g. Focus on Chapter 3"
              : "Describe what you want to study..."
          }
          disabled={isGenerating}
          rows={2}
          className={cn(
            "w-full resize-none bg-transparent px-4 py-3 text-sm text-foreground",
            "placeholder:text-muted-foreground/50 focus:outline-none",
            "disabled:opacity-60"
          )}
        />

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-2 px-3 pb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* File attach */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isGenerating || files.length >= 5}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors",
                "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                "disabled:opacity-40 disabled:pointer-events-none"
              )}
            >
              <HugeiconsIcon icon={Attachment01Icon} size={14} />
              <span className="hidden sm:inline">Attach</span>
            </button>

            <div className="w-px h-4 bg-border/50 mx-0.5" />

            {/* Card count */}
            <Select
              value={config.cardCount}
              onValueChange={(v) =>
                setConfig((prev) => ({
                  ...prev,
                  cardCount: v as GenerateConfig["cardCount"],
                }))
              }
              disabled={isGenerating}
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fewer">Fewer</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="more">More</SelectItem>
              </SelectContent>
            </Select>

            {/* Difficulty */}
            <Select
              value={config.difficulty}
              onValueChange={(v) =>
                setConfig((prev) => ({
                  ...prev,
                  difficulty: v as GenerateConfig["difficulty"],
                }))
              }
              disabled={isGenerating}
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Generate button */}
          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="gap-1.5 rounded-xl shrink-0"
          >
            {isGenerating ? (
              <>
                <HugeiconsIcon
                  icon={SparklesIcon}
                  size={14}
                  className="animate-pulse"
                />
                <span className="hidden sm:inline">Generating...</span>
              </>
            ) : (
              <>
                <HugeiconsIcon icon={ArrowUp02Icon} size={14} />
                <span className="hidden sm:inline">Generate</span>
              </>
            )}
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".txt,.md,.csv,.json,.pdf,.png,.jpg,.jpeg,.gif,.webp,.html,.xml,.yaml,.yml"
          onChange={(e) => {
            if (e.target.files) handleFileSelect(e.target.files);
            e.target.value = "";
          }}
          className="hidden"
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-4 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive animate-fade-in">
          {error}
        </div>
      )}

      {/* Generating indicator */}
      {isGenerating && cards.length === 0 && (
        <div className="mt-8 flex flex-col items-center gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <div
              className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"
              style={{ animationDelay: "150ms" }}
            />
            <div
              className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"
              style={{ animationDelay: "300ms" }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Generating flashcards...
          </p>
        </div>
      )}

      {/* Results */}
      {cards.length > 0 && (
        <div ref={resultsRef} className="mt-6 space-y-4">
          {/* Results header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <HugeiconsIcon icon={Layers01Icon} size={12} />
                {cards.length} cards
              </Badge>
              {isGenerating && (
                <span className="text-xs text-muted-foreground animate-pulse">
                  generating...
                </span>
              )}
            </div>
          </div>

          {/* Card grid */}
          <div className="grid gap-2">
            {cards.map((card, i) => (
              <button
                key={i}
                onClick={() => toggleCardFlip(i)}
                className={cn(
                  "w-full text-left rounded-xl border bg-card p-4 transition-all duration-200",
                  "hover:shadow-sm hover:border-border/80",
                  "animate-slide-up cursor-pointer"
                )}
                style={{ animationDelay: `${Math.min(i * 50, 500)}ms` }}
              >
                <div className="flex items-start gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground font-mono mt-0.5">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    {flippedCards.has(i) ? (
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase tracking-wider text-primary/60 font-medium">
                          Answer
                        </span>
                        <div className="text-sm text-foreground leading-relaxed">
                          <RichText text={card.back} />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">
                          Question
                        </span>
                        <div className="text-sm text-foreground leading-relaxed">
                          <RichText text={card.front} />
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground/40 shrink-0 mt-1">
                    {flippedCards.has(i) ? "Q ←" : "→ A"}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Action bar */}
          {!isGenerating && cards.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 pt-2 animate-fade-in">
              <Button
                size="lg"
                onClick={handleStudyCards}
                className="gap-2 flex-1 sm:flex-initial h-12 sm:h-9"
              >
                <HugeiconsIcon
                  icon={PlayIcon}
                  size={16}
                  data-icon="inline-start"
                />
                Study these cards
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleDownloadCSV}
                className="gap-2 flex-1 sm:flex-initial h-12 sm:h-9"
              >
                <HugeiconsIcon
                  icon={Download04Icon}
                  size={16}
                  data-icon="inline-start"
                />
                Download CSV
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
