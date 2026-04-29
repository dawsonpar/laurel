import { ImageResponse } from "next/og";

import { fetchMoment } from "@/lib/api";

export const runtime = "nodejs";
export const alt = "Laurel moment";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface OgProps {
  params: Promise<{ id: string }>;
}

export default async function OgImage({ params }: OgProps) {
  const { id } = await params;
  const moment = await fetchMoment(id).catch(() => null);

  const sport = moment?.sport_name ?? "Olympic / Paralympic moment";
  const headline = moment?.moment_summary || "What just happened?";
  const explanation = (moment?.explanation ?? "").slice(0, 220);

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px",
          background: "#faf8f4",
          color: "#1a1a1a",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              fontSize: "20px",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "#6b6b6b",
            }}
          >
            Laurel · {sport}
          </div>
          <div style={{ fontSize: "56px", fontWeight: 600, lineHeight: 1.1 }}>
            {headline}
          </div>
          {explanation && (
            <div
              style={{
                fontSize: "26px",
                lineHeight: 1.4,
                color: "#3a3a3a",
                marginTop: "16px",
              }}
            >
              {explanation}
            </div>
          )}
        </div>
        <div
          style={{
            fontSize: "20px",
            color: "#1f4d3a",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          laurel.app
        </div>
      </div>
    ),
    { ...size },
  );
}
