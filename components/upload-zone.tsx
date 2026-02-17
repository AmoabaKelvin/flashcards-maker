"use client";

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Upload04Icon, FileUploadIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";

interface UploadZoneProps {
  onFileLoaded: (content: string, filename: string) => void;
}

export function UploadZone({ onFileLoaded }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const processFile = useCallback(
    (file: File) => {
      setError(null);

      if (!file.name.endsWith(".csv")) {
        setError("Please upload a CSV file.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content) {
          onFileLoaded(content, file.name);
        }
      };
      reader.onerror = () => {
        setError("Failed to read file. Please try again.");
      };
      reader.readAsText(file);
    },
    [onFileLoaded]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounter.current = 0;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        processFile(files[0]);
      }
    },
    [processFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        processFile(files[0]);
      }
    },
    [processFile]
  );

  return (
    <div className="w-full max-w-xl mx-auto animate-slide-up">
      <div
        className={cn(
          "relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer group",
          "hover:border-primary/50 hover:bg-primary/[0.02]",
          isDragging
            ? "border-primary bg-primary/[0.04] shadow-[0_0_0_4px_oklch(0.60_0.13_163/0.08)] scale-[1.01]"
            : "border-border/70"
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        aria-label="Upload CSV file"
      >
        {/* Subtle dot grid background */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden opacity-40">
          <div
            className="w-full h-full"
            style={{
              backgroundImage:
                "radial-gradient(circle, oklch(0.6 0.05 163 / 0.25) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />
        </div>

        <div className="relative flex flex-col items-center gap-5 py-16 px-8 sm:py-20">
          <div
            className={cn(
              "flex items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300",
              isDragging
                ? "bg-primary/15 text-primary scale-110"
                : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
            )}
          >
            <HugeiconsIcon
              icon={isDragging ? FileUploadIcon : Upload04Icon}
              size={28}
            />
          </div>

          <div className="flex flex-col items-center gap-2">
            <p className="text-base font-medium text-foreground">
              {isDragging ? "Drop your file here" : "Drop your CSV file here"}
            </p>
            <p className="text-sm text-muted-foreground">
              or{" "}
              <span className="text-primary font-medium underline underline-offset-4 decoration-primary/40">
                browse files
              </span>
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive font-medium animate-fade-in">
              {error}
            </p>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
          aria-hidden="true"
        />
      </div>

      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
        <span>Supports CSV files with question-answer pairs</span>
      </div>
    </div>
  );
}
