import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LiquidBackground, MainNavigation, BottomNav, GlobalLoading } from "@/components";
import { WelcomeRitual } from "@/components/features/onboarding";
import { NavigationProvider } from "@/lib/client/providers/navigation-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
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
  title: "แม่หมอมีมี่ (Maemormimi) - ไพ่ทาโรต์ฮีลใจ ไขคำตอบชีวิต",
  description: "ปรึกษาดวงชะตา ไพ่ทาโรต์ออนไลน์ กับ 'แม่หมอมีมี่' ชัดเจน ตรงประเด็น! เพื่อนคู่คิด มิตรคู่ใจ พร้อมฮีลใจให้คุณก้าวต่อไป",
  keywords: ["ดูดวง", "ไพ่ทาโรต์", "ไพ่ยิปซี", "ความรัก", "แม่หมอมีมี่", "Maemormimi", "Tarot", "Horoscope", "ดูดวงออนไลน์"],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Maemormimi (แม่หมอมีมี่)",
    title: "แม่หมอมีมี่ (Maemormimi) - ไพ่ทาโรต์ฮีลใจ ไขคำตอบชีวิต",
    description: "ปรึกษาดวงชะตา ไพ่ทาโรต์ออนไลน์ กับ 'แม่หมอมีมี่' ชัดเจน ตรงประเด็น! เพื่อนคู่คิด มิตรคู่ใจ พร้อมฮีลใจให้คุณก้าวต่อไป",
    images: [
      {
        url: resolveAbsoluteUrl("/opengraph-image"),
        width: 1200,
        height: 630,
        alt: "แม่หมอมีมี่ (Maemormimi) - ไพ่ทาโรต์ฮีลใจ ไขคำตอบชีวิต",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "แม่หมอมีมี่ (Maemormimi) - ไพ่ทาโรต์ฮีลใจ ไขคำตอบชีวิต",
    description: "ปรึกษาดวงชะตา ไพ่ทาโรต์ออนไลน์ กับ 'แม่หมอมีมี่' ชัดเจน ตรงประเด็น! เพื่อนคู่คิด มิตรคู่ใจ พร้อมฮีลใจให้คุณก้าวต่อไป",
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
