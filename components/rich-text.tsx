"use client";

import { useMemo } from "react";
import katex from "katex";

type Segment =
  | { type: "text"; content: string }
  | { type: "math"; content: string }
  | { type: "italic"; content: string }
  | { type: "bold"; content: string }
  | { type: "code"; content: string };

function tokenize(text: string): Segment[] {
  const segments: Segment[] = [];
  // Order matters: backtick code first (prevents inner * from being parsed),
  // then $...$ (LaTeX), then **...** (bold), then *...* (italic)
  const pattern = /`([^`]+)`|\$([^$]+)\$|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }

    if (match[1] !== undefined) {
      segments.push({ type: "code", content: match[1] });
    } else if (match[2] !== undefined) {
      segments.push({ type: "math", content: match[2] });
    } else if (match[3] !== undefined) {
      segments.push({ type: "bold", content: match[3] });
    } else if (match[4] !== undefined) {
      segments.push({ type: "italic", content: match[4] });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", content: text.slice(lastIndex) });
  }

  return segments;
}

function renderMath(latex: string): string {
  try {
    return katex.renderToString(latex, {
      throwOnError: false,
      displayMode: false,
      output: "html",
    });
  } catch {
    return latex;
  }
}

interface RichTextProps {
  text: string;
  className?: string;
}

export function RichText({ text, className }: RichTextProps) {
  const segments = useMemo(() => tokenize(text), [text]);

  return (
    <span className={className}>
      {segments.map((segment, i) => {
        switch (segment.type) {
          case "math":
            return (
              <span
                key={i}
                dangerouslySetInnerHTML={{ __html: renderMath(segment.content) }}
              />
            );
          case "code":
            return (
              <code
                key={i}
                className="px-1.5 py-0.5 rounded bg-muted border border-border/50 text-[0.9em] font-mono"
              >
                {segment.content}
              </code>
            );
          case "italic":
            return <em key={i}>{segment.content}</em>;
          case "bold":
            return <strong key={i}>{segment.content}</strong>;
          default:
            return <span key={i}>{segment.content}</span>;
        }
      })}
    </span>
  );
}
