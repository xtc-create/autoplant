import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    tsconfigPath: "tsconfig.next.json",
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
