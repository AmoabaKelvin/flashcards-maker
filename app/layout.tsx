import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Flashcards",
    template: "%s | Flashcards",
  },
  description:
    "Upload a CSV file and study with beautiful, interactive flashcards. Track progress, share decks, and resume sessions.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "https://study.kelvinamoaba.com"
  ),
  openGraph: {
    title: "Flashcards",
    description:
      "Upload a CSV file and study with beautiful, interactive flashcards.",
    siteName: "Flashcards",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Flashcards",
    description:
      "Upload a CSV file and study with beautiful, interactive flashcards.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
