import type { NextConfig } from "next";
import { DEFAULT_LOCALE } from "./src/lib/i18n";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async rewrites() {
    return [
      {
        source: "/manifest.webmanifest",
        destination: `/${DEFAULT_LOCALE}/manifest.webmanifest`,
      },
    ];
  },
};

export default nextConfig;
