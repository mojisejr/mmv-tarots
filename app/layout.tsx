import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LiquidBackground, MainNavigation, BottomNav, GlobalLoading } from "@/components";
import { WelcomeRitual } from "@/components/features/onboarding";
import { NavigationProvider } from "@/lib/client/providers/navigation-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { LiffProvider } from "@/components/providers/liff-provider";
import { getSiteUrl, resolveAbsoluteUrl } from "@/lib/shared/seo";

// Use fallback system fonts for now
const fontClasses = "font-sans";
const siteUrl = getSiteUrl();

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "MimiVibe: Sanctuary for Inner Clarity & Healing",
  description: "Explore your inner world with MimiVibe. A digital sanctuary for personal reflection, emotional wellness, and intuitive guidance. Find clarity, not just answers.",
  keywords: ["Wellness", "Mindfulness", "Personal Growth", "Self-Reflection", "Inner Peace", "Healing", "Guidance", "MimiVibe", "Insight"],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "MimiVibe",
    title: "MimiVibe: Sanctuary for Inner Clarity & Healing",
    description: "Explore your inner world with MimiVibe. A digital sanctuary for personal reflection, emotional wellness, and intuitive guidance. Find clarity, not just answers.",
    images: [
      {
        url: resolveAbsoluteUrl("/opengraph-image"),
        width: 1200,
        height: 630,
        alt: "MimiVibe - Inner Clarity & Healing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MimiVibe: Sanctuary for Inner Clarity & Healing",
    description: "Explore your inner world with MimiVibe. A digital sanctuary for personal reflection, emotional wellness, and intuitive guidance. Find clarity, not just answers.",
    images: [resolveAbsoluteUrl("/opengraph-image")],
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
        className={`${fontClasses} antialiased bg-background text-foreground safe-top min-h-screen flex flex-col`}
        style={{ fontFamily: 'Montserrat, system-ui, sans-serif' }}
      >
        <LiquidBackground />
        <ToastProvider />
        <LiffProvider>
          <NavigationProvider>
            <GlobalLoading />
            <WelcomeRitual />
            <MainNavigation />
            <main className="flex-1 pt-16 md:pt-20 relative z-10 pb-[env(safe-area-inset-bottom)]">
              {children}
            </main>
            <BottomNav />
          </NavigationProvider>
        </LiffProvider>
      </body>
    </html>
  );
}
