import type { NextConfig } from "next";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob: https://pexamdyctxcxelshixfz.supabase.co",
  "connect-src 'self' https://pexamdyctxcxelshixfz.supabase.co wss://pexamdyctxcxelshixfz.supabase.co https://challenges.cloudflare.com",
  "frame-src https://challenges.cloudflare.com",
  "media-src 'self' blob: https://pexamdyctxcxelshixfz.supabase.co",
  "worker-src 'self' blob:",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
];

const nextConfig: NextConfig = {
  // Sites builds the Cloudflare/Vinext source tree. Vercel runs Next directly,
  // so its type check excludes Cloudflare Worker and Deno Edge Function files.
  ...(process.env.VERCEL
    ? { typescript: { tsconfigPath: "./tsconfig.vercel.json" } }
    : {}),
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
