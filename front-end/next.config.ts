import type { NextConfig } from "next"
import path from "node:path"

const production = process.env.NODE_ENV === "production"
const scriptPolicy = production
  ? "script-src 'self' 'unsafe-inline'"
  : "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
const connectPolicy = production ? "connect-src 'self'" : "connect-src 'self' ws: http:"
const apiImageOrigin = (() => {
  const value = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL
  if (!value) return ""
  try {
    return new URL(value).origin
  } catch {
    return ""
  }
})()
const imagePolicy = production
  ? `img-src 'self' data: blob: https://res.cloudinary.com${apiImageOrigin ? ` ${apiImageOrigin}` : ""}`
  : "img-src 'self' data: blob: http: https:"

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'; ${imagePolicy}; font-src 'self' data:; style-src 'self' 'unsafe-inline'; ${scriptPolicy}; ${connectPolicy}`,
          },
        ],
      },
    ]
  },
}

export default nextConfig
