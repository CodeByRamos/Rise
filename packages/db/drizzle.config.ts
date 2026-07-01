import { defineConfig } from "drizzle-kit";

/**
 * Config do drizzle-kit. As migrações reais precisam de um Postgres (Supabase) —
 * defina DATABASE_URL no ambiente. O schema é a fonte para `db:generate`.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
