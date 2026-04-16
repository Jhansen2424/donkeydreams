import path from "node:path";
import { defineConfig } from "prisma/config";
import dotenv from "dotenv";

// Prisma 7 no longer auto-loads .env.local — do it manually.
dotenv.config({ path: path.join(__dirname, ".env.local") });
dotenv.config({ path: path.join(__dirname, ".env") });

export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  migrations: {
    path: path.join(__dirname, "prisma", "migrations"),
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
