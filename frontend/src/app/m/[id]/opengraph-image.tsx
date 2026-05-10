import { ImageResponse } from "next/og";

import { fetchMoment } from "@/lib/api";

export const alt = "Laurel moment";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface OgProps {
  params: Promise<{ id: string }>;
}

export default async function Image({ params }: OgProps) {
  const { id } = await params;
  const moment = await fetchMoment(id).catch(() => null);

  const sport = moment?.sport_name ?? "Olympic / Paralympic";
  const headline =
    moment?.moment_summary?.slice(0, 120) || "What just happened?";
  const explanation = (moment?.explanation ?? "").slice(0, 200);

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 60,
          background:
            "linear-gradient(135deg, #e8d49c 0%, #faf8f4 35%, #faf8f4 100%)",
          color: "#1a1a1a",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 20,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "#1f4d3a",
              marginBottom: 24,
            }}
          >
            Laurel · {sport}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 60,
              fontWeight: 600,
              lineHeight: 1.1,
            }}
          >
            {headline}
          </div>
          {explanation && (
            <div
              style={{
                display: "flex",
                fontSize: 26,
                lineHeight: 1.4,
                color: "#3a3a3a",
                marginTop: 24,
              }}
            >
              {explanation}
            </div>
          )}
        </div>
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
              fontSize: 18,
              color: "#a88a4a",
              letterSpacing: 5,
              textTransform: "uppercase",
            }}
          >
            Understand the Games
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 18,
              color: "#1f4d3a",
              letterSpacing: 5,
              textTransform: "uppercase",
            }}
          >
            laurel
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
