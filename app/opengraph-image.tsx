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
          // Pink Theme (System Colors): Background #FFF0F0 -> Primary #FFD6D1
          background: "linear-gradient(135deg, #FFF0F0 0%, #FFE4E1 50%, #FFD6D1 100%)",
          color: "#592E2E", // Foreground Color (Deep Red-Brown)
        }}
      >
        {/* Decorative Elements */}
        <div
          style={{
            position: "absolute",
            top: -100,
            left: -100,
            width: 400,
            height: 400,
            background: "rgba(212, 175, 55, 0.1)", // Accent Gold
            filter: "blur(80px)",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -50,
            right: -50,
            width: 300,
            height: 300,
            background: "rgba(242, 118, 105, 0.15)", // Primary 500
            filter: "blur(60px)",
            borderRadius: "50%",
          }}
        />

        {/* Brand Name */}
        <div 
          style={{ 
            fontSize: 80, 
            fontWeight: 700, 
            marginBottom: 24,
            letterSpacing: '-2px',
            textShadow: "0 2px 10px rgba(89, 46, 46, 0.1)",
            zIndex: 10
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
            fontWeight: 500,
            maxWidth: '800px',
            lineHeight: 1.4,
            color: "#8C6B6B", // Muted Foreground
            zIndex: 10
          }}
        >
          Sanctuary for Inner Clarity & Healing
        </div>

        {/* Visual Pill / Badge */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.4)",
            padding: "16px 40px",
            borderRadius: "100px",
            border: "1px solid rgba(255, 255, 255, 0.6)",
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: '1px',
            color: "#592E2E",
            boxShadow: "0 4px 20px rgba(89, 46, 46, 0.05)",
            zIndex: 10
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