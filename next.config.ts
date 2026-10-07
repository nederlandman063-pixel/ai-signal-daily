import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // The managed build sandbox cannot capture nested tsc stdout reliably.
  // Keep Next's in-process TypeScript checker enabled (the stable default path).
  experimental: { useTypeScriptCli: false },
  images: { formats: ["image/avif", "image/webp"], unoptimized: true },
};

export default nextConfig;
