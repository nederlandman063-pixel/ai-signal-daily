import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // The managed build sandbox cannot capture nested tsc stdout reliably.
  // Keep Next's in-process TypeScript checker enabled (the stable default path).
  experimental: { useTypeScriptCli: false },
  images: { formats: ["image/avif", "image/webp"], unoptimized: true },
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet" },
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
    ] }];
  },
};

export default nextConfig;
