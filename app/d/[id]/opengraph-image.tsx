import { ImageResponse } from "next/og";
import { loadDeck } from "@/app/actions";
import { parseCSV } from "@/lib/csv-parser";

export const alt = "Shared Flashcard Deck";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deck = await loadDeck(id);

  const deckName = deck?.name ?? "Flashcard Deck";
  const cardCount = deck ? parseCSV(deck.csvContent).length : 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(145deg, #f0fdfa 0%, #e6f7f3 30%, #f8fffe 60%, #ecfdf5 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Dot grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage:
              "radial-gradient(circle, #0d948815 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Blobs */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, #0d948818, transparent 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -120,
            left: -60,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, #0d948810, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Card stack */}
        <div
          style={{
            display: "flex",
            position: "relative",
            width: 180,
            height: 120,
            marginBottom: 36,
          }}
        >
          <div
            style={{
              position: "absolute",
              width: 160,
              height: 110,
              borderRadius: 14,
              background: "white",
              border: "1.5px solid #0d948830",
              boxShadow: "0 2px 8px rgba(13,148,136,0.06)",
              transform: "rotate(-5deg) translateX(-4px)",
              display: "flex",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 160,
              height: 110,
              borderRadius: 14,
              background: "white",
              border: "1.5px solid #0d948830",
              boxShadow: "0 4px 12px rgba(13,148,136,0.08)",
              transform: "rotate(2deg) translateX(4px)",
              display: "flex",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 160,
              height: 110,
              borderRadius: 14,
              background: "linear-gradient(135deg, #0d9488, #0f766e)",
              boxShadow: "0 8px 30px rgba(13,148,136,0.25)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              left: 10,
              top: 5,
              gap: 8,
            }}
          >
            <div
              style={{
                width: 100,
                height: 6,
                borderRadius: 3,
                background: "rgba(255,255,255,0.85)",
                display: "flex",
              }}
            />
            <div
              style={{
                width: 66,
                height: 6,
                borderRadius: 3,
                background: "rgba(255,255,255,0.45)",
                display: "flex",
              }}
            />
            <div
              style={{
                width: 80,
                height: 6,
                borderRadius: 3,
                background: "rgba(255,255,255,0.25)",
                display: "flex",
              }}
            />
          </div>
        </div>

        {/* Deck name */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            maxWidth: 900,
            padding: "0 40px",
          }}
        >
          <span
            style={{
              fontSize: 56,
              fontFamily: "Georgia, serif",
              color: "#0f172a",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              textAlign: "center",
              fontStyle: "italic",
            }}
          >
            {deckName}
          </span>

          {/* Card count pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 20px",
              borderRadius: 100,
              background: "#0d948815",
              border: "1px solid #0d948825",
            }}
          >
            <span
              style={{
                fontSize: 18,
                fontFamily: "system-ui, sans-serif",
                color: "#0d9488",
                fontWeight: 500,
              }}
            >
              {cardCount} flashcards
            </span>
          </div>

          <span
            style={{
              fontSize: 20,
              fontFamily: "system-ui, sans-serif",
              color: "#94a3b8",
              marginTop: 4,
            }}
          >
            Shared via Flashcards
          </span>
        </div>

        {/* Bottom accent */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, #0d9488, #14b8a6, #0d9488)",
            display: "flex",
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
