import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "64px",
          background: "linear-gradient(135deg, #121218 0%, #2B234A 55%, #6A3F8F 100%)",
          color: "#FFFFFF",
          fontFamily: "Montserrat, system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: 28, opacity: 0.85, marginBottom: 20 }}>MimiVibe</div>
        <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1, maxWidth: "90%" }}>
          Personal Insight & Wellness Experience
        </div>
        <div style={{ marginTop: 28, fontSize: 30, opacity: 0.9 }}>
          maemormimi.com
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}