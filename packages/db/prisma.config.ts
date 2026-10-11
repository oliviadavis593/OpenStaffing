import path from "node:path";
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// The single .env lives at the repo root. Prisma commands run from packages/db.
config({ path: path.resolve(process.cwd(), "../../.env") });

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
});
