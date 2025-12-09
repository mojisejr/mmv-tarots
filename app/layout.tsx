import type { Metadata } from "next";
import { Montserrat, Merriweather, Ubuntu_Mono } from "next/font/google";
import "./globals.css";
import { LiquidBackground } from "@/components/background/liquid-background";

const fontSans = Montserrat({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fontSerif = Merriweather({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

const fontMono = Ubuntu_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "MimiVibe - Cosmic Tarot Reader",
  description: "AI-powered tarot reading application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} antialiased bg-[#2a2a2e] text-white`}
      >
        <LiquidBackground />
        {children}
      </body>
    </html>
  );
}
