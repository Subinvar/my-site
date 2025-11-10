import type { NextConfig } from "next";
import createMarkdocPlugin from "@markdoc/next.js";
import { DEFAULT_LOCALE } from "./src/lib/i18n";

const withMarkdoc = createMarkdocPlugin({
  schemaPath: "./markdoc/config.ts",
  extension: /\.md(oc)?$/,
});

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  turbopack: {},
  env: {
    KEYSTATIC_GITHUB_CLIENT_ID: process.env.KEYSTATIC_GITHUB_CLIENT_ID ?? "stub-client-id",
    KEYSTATIC_GITHUB_CLIENT_SECRET: process.env.KEYSTATIC_GITHUB_CLIENT_SECRET ?? "stub-client-secret",
    KEYSTATIC_SECRET: process.env.KEYSTATIC_SECRET ?? "stub-keystatic-secret",
  },
  async rewrites() {
    return [
      {
        source: "/manifest.webmanifest",
        destination: `/${DEFAULT_LOCALE}/manifest.webmanifest`,
      },
    ];
  },
};

export default withMarkdoc(nextConfig);