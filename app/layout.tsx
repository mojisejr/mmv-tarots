import type { Metadata } from "next";
import "./globals.css";
import { LiquidBackground, MainNavigation } from "@/components";
import { NavigationProvider } from "@/lib/client/providers/navigation-provider";

// Use fallback system fonts for now
const fontClasses = "font-sans";

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@100..900&family=Merriweather:wght@300;400;700&family=Ubuntu+Mono:wght@400&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`${fontClasses} antialiased bg-background text-foreground safe-top`}
        style={{ fontFamily: 'Montserrat, system-ui, sans-serif' }}
      >
        <LiquidBackground />
        <NavigationProvider>
          <MainNavigation />
          <main className="flex-1 pt-16 relative z-10">{children}</main>
        </NavigationProvider>
      </body>
    </html>
  );
}
