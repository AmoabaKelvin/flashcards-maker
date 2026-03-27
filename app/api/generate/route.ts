import { streamText, Output } from "ai";
import { z } from "zod";

export const maxDuration = 60;

const flashcardSchema = z.object({
  front: z
    .string()
    .describe("The question, term, or concept to test knowledge of"),
  back: z
    .string()
    .describe("The answer, definition, or explanation"),
});

const requestSchema = z.object({
  instructions: z.string().default(""),
  files: z
    .array(
      z.object({
        content: z.string(),
        type: z.string(),
        name: z.string(),
        isText: z.boolean(),
      })
    )
    .default([]),
  config: z.object({
    cardCount: z.enum(["fewer", "standard", "more"]).default("standard"),
    difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  }),
});

export async function POST(req: Request) {
  const parsed = requestSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { instructions, files, config } = parsed.data;

  const cardCounts: Record<string, string> = {
    fewer: "8 to 12",
    standard: "18 to 25",
    more: "35 to 50",
  };

  const difficulties: Record<string, string> = {
    easy: "Focus on basic recall, simple definitions, and straightforward facts.",
    medium:
      "Mix of recall, understanding, and application questions.",
    hard: "Focus on analysis, synthesis, comparison, and critical thinking.",
  };

  const systemPrompt = `You are an expert flashcard creator. Generate high-quality study flashcards.

Guidelines:
- Generate ${cardCounts[config.cardCount] || "18 to 25"} flashcards
- Difficulty: ${difficulties[config.difficulty] || difficulties.medium}
- Front: clear, specific question or term
- Back: concise, accurate answer or definition
- Use LaTeX notation ($...$) for math/science formulas where appropriate
- Use *italics* for scientific names or emphasis
- Cover key concepts comprehensively without repetition
- Vary question types: definitions, processes, comparisons, applications`;

  // Build message content parts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contentParts: any[] = [];

  for (const file of files) {
    if (file.isText) {
      contentParts.push({
        type: "text",
        text: `--- File: ${file.name} ---\n${file.content}\n--- End of file ---`,
      });
    } else if (file.type.startsWith("image/")) {
      const commaIdx = file.content.indexOf(",");
      const base64 = commaIdx !== -1 ? file.content.slice(commaIdx + 1) : file.content;
      if (!base64) continue;
      contentParts.push({
        type: "image",
        image: base64,
      });
    } else {
      const commaIdx = file.content.indexOf(",");
      const base64 = commaIdx !== -1 ? file.content.slice(commaIdx + 1) : file.content;
      if (!base64) continue;
      contentParts.push({
        type: "file",
        data: base64,
        mediaType: file.type,
      });
    }
  }

  const defaultInstructions =
    files.length > 0
      ? "Generate flashcards based on the provided content."
      : "Generate flashcards about the topic described.";

  contentParts.push({
    type: "text",
    text: instructions || defaultInstructions,
  });

  const { elementStream } = streamText({
    model: "google/gemini-3-flash",
    system: systemPrompt,
    messages: [{ role: "user" as const, content: contentParts }],
    output: Output.array({
      element: flashcardSchema,
    }),
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const element of elementStream) {
          controller.enqueue(
            encoder.encode(JSON.stringify(element) + "\n")
          );
        }
        controller.close();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Generation failed";
        controller.enqueue(
          encoder.encode(JSON.stringify({ error: message }) + "\n")
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
    },
  });
}
