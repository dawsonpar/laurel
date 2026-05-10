import { ImageResponse } from "next/og";

import { fetchMoment } from "@/lib/api";

export const alt = "Laurel moment";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface OgProps {
  params: Promise<{ id: string }>;
}

// Headline character cap. Tuned so a two-line headline at 64px fully fits
// inside the iMessage rich-preview crop without cutting mid-word.
const HEADLINE_CAP = 90;

export default async function Image({ params }: OgProps) {
  const { id } = await params;
  const moment = await fetchMoment(id).catch(() => null);

  const sport = (moment?.sport_name ?? "Olympic / Paralympic").toUpperCase();
  const headline = truncateAtWord(
    moment?.moment_summary || "A moment from the Games.",
    HEADLINE_CAP,
  );

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background:
            "linear-gradient(135deg, #faf8f4 0%, #faf8f4 55%, #f1e3bc 100%)",
          color: "#1a1a1a",
        }}
      >
        {/* Top row: laurel logo + sport chip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
          }}
        >
          <LaurelGlyph size={96} color="#1f4d3a" />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 18px",
              borderRadius: 999,
              background: "#1f4d3a",
              color: "#f4efe3",
              fontSize: 22,
              letterSpacing: 4,
              fontWeight: 600,
            }}
          >
            {sport}
          </div>
        </div>

        {/* Headline: the one-sentence moment summary */}
        <div
          style={{
            display: "flex",
            fontSize: 64,
            fontWeight: 600,
            lineHeight: 1.15,
            color: "#1a1a1a",
            letterSpacing: -0.5,
          }}
        >
          {headline}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: 5,
              textTransform: "uppercase",
              color: "#1f4d3a",
            }}
          >
            Laurel
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 20,
              color: "#a88a4a",
              letterSpacing: 5,
              textTransform: "uppercase",
            }}
          >
            Understand the Games
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

function truncateAtWord(text: string, cap: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= cap) return trimmed;
  const slice = trimmed.slice(0, cap);
  const lastSpace = slice.lastIndexOf(" ");
  const safe = lastSpace > cap * 0.6 ? slice.slice(0, lastSpace) : slice;
  return safe.replace(/[.,;:!?\s]+$/, "") + "...";
}

function LaurelGlyph({ size, color }: { size: number; color: string }) {
  // Inline copy of the LaurelMark SVG. Satori renders <svg> children, so the
  // wreath glyph renders identically to the on-site logo without a font load.
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M32 56 C 18 50, 10 38, 10 22" />
      <path d="M14 22 C 9 18, 6 16, 4 16 C 6 20, 10 23, 14 22 Z" fill={color} fillOpacity={0.18} />
      <path d="M14 28 C 9 25, 6 24, 4 24 C 6 27, 10 30, 14 28 Z" fill={color} fillOpacity={0.18} />
      <path d="M16 35 C 11 33, 8 32, 6 33 C 8 36, 12 38, 16 35 Z" fill={color} fillOpacity={0.18} />
      <path d="M20 41 C 15 40, 12 40, 10 41 C 12 44, 16 45, 20 41 Z" fill={color} fillOpacity={0.18} />
      <path d="M25 47 C 20 47, 17 47, 16 48 C 18 51, 22 51, 25 47 Z" fill={color} fillOpacity={0.18} />
      <path d="M32 56 C 46 50, 54 38, 54 22" />
      <path d="M50 22 C 55 18, 58 16, 60 16 C 58 20, 54 23, 50 22 Z" fill={color} fillOpacity={0.18} />
      <path d="M50 28 C 55 25, 58 24, 60 24 C 58 27, 54 30, 50 28 Z" fill={color} fillOpacity={0.18} />
      <path d="M48 35 C 53 33, 56 32, 58 33 C 56 36, 52 38, 48 35 Z" fill={color} fillOpacity={0.18} />
      <path d="M44 41 C 49 40, 52 40, 54 41 C 52 44, 48 45, 44 41 Z" fill={color} fillOpacity={0.18} />
      <path d="M39 47 C 44 47, 47 47, 48 48 C 46 51, 42 51, 39 47 Z" fill={color} fillOpacity={0.18} />
    </svg>
  );
}
