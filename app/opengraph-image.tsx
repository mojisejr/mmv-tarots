import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function OpenGraphImage() {
  // Attempt to load a Thai-compatible font (e.g., Noto Sans Thai)
  // If this fails securely (e.g., no internet), we fallback to system font which might not render Thai perfectly on all environments,
  // but for Vercel/Next.js OG, a font file is usually required for non-Latin.
  // We will use a standard fetch for Noto Sans Thai from Google Fonts CDN or GitHub raw.
  const notoBold = await fetch(
    new URL("https://github.com/google/fonts/raw/main/ofl/notosansthai/NotoSansThai-Bold.ttf", import.meta.url)
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          padding: "48px",
          // Mystic Warm Gradient: Deep Purple to Rose Gold/Soft Red
          background: "linear-gradient(135deg, #2B234A 0%, #5E366A 45%, #F27669 100%)",
          color: "#FFFFFF",
        }}
      >
        {/* Brand Name */}
        <div 
          style={{ 
            fontSize: 72, 
            fontWeight: 700, 
            marginBottom: 16,
            textShadow: "0 4px 12px rgba(0,0,0,0.3)"
          }}
        >
          แม่หมอมีมี่
        </div>

        {/* Subtitle */}
        <div 
          style={{ 
            fontSize: 36, 
            opacity: 0.9, 
            marginBottom: 40,
            fontWeight: 400
          }}
        >
          ไพ่ทาโรต์ฮีลใจ ไขคำตอบชีวิต
        </div>

        {/* URL Badge */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.15)",
            padding: "12px 32px",
            borderRadius: "50px",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            fontSize: 24,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          maemormimi.com
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Noto Sans Thai",
          data: notoBold,
          style: "normal",
          weight: 700,
        },
      ],
    }
  );
}