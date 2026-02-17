import { ImageResponse } from "next/og";

export const alt = "Flashcards - Study smarter with beautiful flashcards";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
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
        {/* Dot grid pattern */}
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

        {/* Top-right blob */}
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

        {/* Bottom-left blob */}
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
            width: 220,
            height: 150,
            marginBottom: 40,
          }}
        >
          {/* Back card */}
          <div
            style={{
              position: "absolute",
              width: 200,
              height: 140,
              borderRadius: 16,
              background: "white",
              border: "1.5px solid #0d948830",
              boxShadow: "0 2px 8px rgba(13,148,136,0.06)",
              transform: "rotate(-5deg) translateX(-6px)",
              display: "flex",
            }}
          />
          {/* Middle card */}
          <div
            style={{
              position: "absolute",
              width: 200,
              height: 140,
              borderRadius: 16,
              background: "white",
              border: "1.5px solid #0d948830",
              boxShadow: "0 4px 12px rgba(13,148,136,0.08)",
              transform: "rotate(2deg) translateX(6px)",
              display: "flex",
            }}
          />
          {/* Front card */}
          <div
            style={{
              position: "absolute",
              width: 200,
              height: 140,
              borderRadius: 16,
              background: "linear-gradient(135deg, #0d9488, #0f766e)",
              boxShadow: "0 8px 30px rgba(13,148,136,0.25)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              left: 10,
              top: 5,
              gap: 10,
            }}
          >
            <div
              style={{
                width: 120,
                height: 8,
                borderRadius: 4,
                background: "rgba(255,255,255,0.85)",
                display: "flex",
              }}
            />
            <div
              style={{
                width: 80,
                height: 8,
                borderRadius: 4,
                background: "rgba(255,255,255,0.45)",
                display: "flex",
              }}
            />
            <div
              style={{
                width: 96,
                height: 8,
                borderRadius: 4,
                background: "rgba(255,255,255,0.25)",
                display: "flex",
              }}
            />
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <span
            style={{
              fontSize: 72,
              fontFamily: "Georgia, serif",
              color: "#0f172a",
              lineHeight: 1,
              letterSpacing: "-0.02em",
              fontStyle: "italic",
            }}
          >
            Flashcards
          </span>

          <span
            style={{
              fontSize: 24,
              fontFamily: "system-ui, sans-serif",
              color: "#64748b",
              letterSpacing: "-0.01em",
            }}
          >
            Upload a CSV. Start studying. It&apos;s that simple.
          </span>
        </div>

        {/* Bottom accent bar */}
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
