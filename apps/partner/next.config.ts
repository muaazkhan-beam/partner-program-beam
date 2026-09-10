import path from "node:path"
import type { NextConfig } from "next"

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? ""
const convexSiteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL ?? ""
const convexWebSocketUrl = convexUrl.replace(/^https:/, "wss:")
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data: blob: https://lh3.googleusercontent.com",
  "frame-src 'self' https://cdn.shares.beam.ai",
  [
    "connect-src 'self'",
    "https://*.convex.cloud",
    "wss://*.convex.cloud",
    "https://*.convex.site",
    convexUrl,
    convexSiteUrl,
    convexWebSocketUrl,
  ]
    .filter(Boolean)
    .join(" "),
  "form-action 'self' https://accounts.google.com",
  "upgrade-insecure-requests",
].join("; ")

const previewContentSecurityPolicy = [
  "default-src 'self' data: blob:",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'self'",
  "form-action 'none'",
  "base-uri 'self'",
].join("; ")

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(import.meta.dirname, "../.."),
  experimental: {
    externalDir: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        source: "/api/share-preview/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: previewContentSecurityPolicy,
          },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ]
  },
}

export default nextConfig
