import type { Metadata } from "next";
import "./globals.css";
import { LiquidBackground, MainNavigation, BottomNav, GlobalLoading } from "@/components";
import { WelcomeRitual } from "@/components/features/onboarding";
import { NavigationProvider } from "@/lib/client/providers/navigation-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { getSiteUrl, resolveAbsoluteUrl } from "@/lib/shared/seo";

// Use fallback system fonts for now
const fontClasses = "font-sans";
const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "MimiVibe: Personal Insight & Wellness Experience",
  description: "Digital insight experience for personal reflection and wellness guidance. Purchase digital tokens to unlock private readings and support content.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "MimiVibe",
    title: "MimiVibe: Personal Insight & Wellness Experience",
    description: "Digital insight experience for personal reflection and wellness guidance. Purchase digital tokens to unlock private readings and support content.",
    images: [
      {
        url: resolveAbsoluteUrl("/opengraph-image"),
        width: 1200,
        height: 630,
        alt: "MimiVibe personal insight and wellness",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MimiVibe: Personal Insight & Wellness Experience",
    description: "Digital insight experience for personal reflection and wellness guidance. Purchase digital tokens to unlock private readings and support content.",
    images: [resolveAbsoluteUrl("/opengraph-image")],
  },
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
        className={`${fontClasses} antialiased bg-background text-foreground safe-top min-h-screen flex flex-col`}
        style={{ fontFamily: 'Montserrat, system-ui, sans-serif' }}
      >
        <LiquidBackground />
        <ToastProvider />
        <NavigationProvider>
          <GlobalLoading />
          <WelcomeRitual />
          <MainNavigation />
          <main className="flex-1 pt-16 md:pt-20 relative z-10 pb-[env(safe-area-inset-bottom)]">
            {children}
          </main>
          <BottomNav />
        </NavigationProvider>
      </body>
    </html>
  );
}
