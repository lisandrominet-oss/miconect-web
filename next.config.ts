import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sites builds the Cloudflare/Vinext source tree. Vercel runs Next directly,
  // so its type check excludes Cloudflare Worker and Deno Edge Function files.
  ...(process.env.VERCEL
    ? { typescript: { tsconfigPath: "./tsconfig.vercel.json" } }
    : {}),
};

export default nextConfig;
