import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Standalone output: the Docker runner stage copies only
  // .next/standalone + .next/static + public (~150MB) instead of the whole
  // workspace (node_modules + full .next), shrinking the image ~5GB → ~200MB.
  output: "standalone",
  // Monorepo requirement (Next docs): without an explicit tracing root the
  // tracer infers the wrong workspace root and the standalone output is
  // silently incomplete (server.js with no node_modules). The workspace
  // root is one level above frontend/ both in Docker (/app) and locally.
  outputFileTracingRoot: path.resolve(process.cwd(), ".."),
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.yotop10.com",
      },
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
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
