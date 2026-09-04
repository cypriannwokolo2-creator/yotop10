import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.yotop10.com",
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  devIndicators: {
    buildActivity: false,
  },
  env: {
    INTERNAL_API_URL: process.env.INTERNAL_API_URL || 'http://backend:8000/api',
  },
  async rewrites() {
    const backendUrl = process.env.INTERNAL_API_URL || 'http://backend:8000/api';
    // Strip trailing /api for rewrite destination base (source already has /api)
    const base = backendUrl.replace(/\/api\/?$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${base}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${base}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
