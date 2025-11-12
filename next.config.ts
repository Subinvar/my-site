import type { NextConfig } from "next";
import createMarkdocPlugin from "@markdoc/next.js";

const withMarkdoc = createMarkdocPlugin({
  schemaPath: './markdoc/config.ts',
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
};

export default withMarkdoc(nextConfig);