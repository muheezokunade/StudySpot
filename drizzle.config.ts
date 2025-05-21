import { defineConfig } from "drizzle-kit";
import { join } from 'path';

// Use SQLite for local development
export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: './local.db',
  }
});
