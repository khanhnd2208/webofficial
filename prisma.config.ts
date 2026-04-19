// Prisma config (v7) — load .env.local for Next.js + Prisma CLI compatibility
import { config } from 'dotenv';
import { expand } from 'dotenv-expand';
import { resolve } from 'path';
expand(config({ path: resolve(process.cwd(), '.env.local') }));
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
