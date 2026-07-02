import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Os pacotes internos são publicados como TypeScript-fonte; o Next transpila.
  transpilePackages: ["@rise/core", "@rise/db", "@rise/api", "@rise/ai"],
};

export default nextConfig;
