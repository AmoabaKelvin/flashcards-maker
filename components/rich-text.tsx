"use client";

import { useMemo } from "react";
import katex from "katex";

type Segment =
  | { type: "text"; content: string }
  | { type: "math"; content: string }
  | { type: "italic"; content: string }
  | { type: "bold"; content: string };

function tokenize(text: string): Segment[] {
  const segments: Segment[] = [];
  // Match $...$ (LaTeX), **...** (bold), *...* (italic)
  const pattern = /\$([^$]+)\$|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    // Add preceding plain text
    if (match.index > lastIndex) {
      segments.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }

    if (match[1] !== undefined) {
      segments.push({ type: "math", content: match[1] });
    } else if (match[2] !== undefined) {
      segments.push({ type: "bold", content: match[2] });
    } else if (match[3] !== undefined) {
      segments.push({ type: "italic", content: match[3] });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
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
