import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // O domínio puro (@rise/core) é publicado como TypeScript-fonte; o Next transpila.
  transpilePackages: ["@rise/core"],
};

export default nextConfig;
