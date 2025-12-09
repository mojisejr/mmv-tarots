import type { Metadata } from "next";
import { Montserrat, Merriweather, Ubuntu_Mono } from "next/font/google";
import "./globals.css";
import { LiquidBackground } from "@/components/background/liquid-background";
import { NavigationProvider } from "@/lib/providers/navigation-provider";
import { MainNavigation } from "@/components/layout/main-navigation";

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
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
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
        className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} antialiased bg-[#2a2a2e] text-white`}
      >
        <LiquidBackground />
        <NavigationProvider>
          <MainNavigation />
          <main className="flex-1">{children}</main>
        </NavigationProvider>
      </body>
    </html>
  );
}
