import path from "node:path";
import { config } from "dotenv";
import type { NextConfig } from "next";

// The single .env lives at the repo root; Next only reads env files in apps/web by default.
config({ path: path.resolve(process.cwd(), "../../.env") });

const nextConfig: NextConfig = {
  // Workspace packages ship TypeScript source; Next compiles them.
  transpilePackages: ["@openstaffing/core", "@openstaffing/db"],
  poweredByHeader: false,
};

export default nextConfig;
