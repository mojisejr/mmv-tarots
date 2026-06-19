import { withWorkflow } from "workflow/next";
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // content-creator ใช้ native server modules — กัน Next/Turbopack bundle, require ตอน runtime (server-only)
  serverExternalPackages: ["better-sqlite3", "@resvg/resvg-js"],
  // daily-7 composition อ่าน bg pool + font ผ่าน "dynamic path" (จาก manifest) — Next file-tracing
  // ตรวจไม่เจอ → ต้อง force-include ไม่งั้น lambda บน Vercel หา asset ไม่เจอ (local อ่านได้แต่ prod พัง) [S6b]
  outputFileTracingIncludes: {
    "/content-creator/**": ["./content-creator/assets/**", "./assets/fonts/**"],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wtnqjxerhmdnqszkhbvs.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/cards/**',
      },
    ],
  },
};

export default withSentryConfig(withWorkflow(nextConfig), {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: "mimivibe",
  project: "mmv-tarots",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Automatically annotate React components to show their full name in breadcrumbs and session replay
  reactComponentAnnotation: {
    enabled: true,
  },

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  // Hides source maps from generated client bundles
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers)
  // https://docs.sentry.io/product/crons/
  // automaticVercelMonitors: true,
});
