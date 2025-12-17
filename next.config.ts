import { withWorkflow } from "workflow/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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

export default withWorkflow(nextConfig);
