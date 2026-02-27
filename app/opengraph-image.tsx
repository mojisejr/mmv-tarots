import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function OpenGraphImage() {
  // We use standard font or can load a specific one if needed. 
  // For English, the default Vercel OG font is usually sufficient and safe.
  
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
          // Serene Gradient: Deep Indigo to Soft Lavender/Wellness vibe
          background: "linear-gradient(135deg, #1A1A2E 0%, #4A4E69 50%, #9A8C98 100%)",
          color: "#FFFFFF",
        }}
      >
        {/* Brand Name */}
        <div 
          style={{ 
            fontSize: 80, 
            fontWeight: 700, 
            marginBottom: 24,
            letterSpacing: '-2px',
            textShadow: "0 4px 12px rgba(0,0,0,0.2)"
          }}
        >
          MimiVibe
        </div>

        {/* Subtitle - Focus on Wellness/Sanctuary */}
        <div 
          style={{ 
            fontSize: 32, 
            opacity: 0.9, 
            marginBottom: 48,
            fontWeight: 400,
            maxWidth: '800px',
            lineHeight: 1.4
          }}
        >
          Sanctuary for Inner Clarity & Healing
        </div>

        {/* Visual Pill / Badge */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            padding: "16px 40px",
            borderRadius: "100px",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            fontSize: 24,
            opacity: 0.8,
            letterSpacing: '1px'
          }}
        >
          mimivibe.com
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}