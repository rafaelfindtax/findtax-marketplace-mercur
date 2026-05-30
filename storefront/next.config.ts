import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  trailingSlash: false,
  reactStrictMode: true,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  images: {
    remotePatterns: [
      // Logos de sellers/produtos vêm de hosts arbitrários (CDNs diversos).
      // Wildcard libera qualquer host HTTPS para evitar allowlist interminável.
      {
        protocol: "https",
        hostname: "**",
      },
      // Imagens locais / MinIO em dev.
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    qualities: [50, 70, 75, 85],
  },
}

module.exports = nextConfig
