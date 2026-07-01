/**
 * Aplica as migrações do drizzle. Lê DATABASE_URL do ambiente (carregue o
 * .env.local ao rodar). SSL automático para Supabase.
 *   DATABASE_URL=... pnpm --filter @rise/db db:migrate:apply
 */
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL ausente.");
  process.exit(1);
}

const usaSsl = /supabase\.(co|com)/.test(url);
const sql = postgres(url, {
  max: 1,
  connect_timeout: 30,
  ...(usaSsl ? { ssl: "require" as const } : {}),
});
const db = drizzle(sql);
const folder = resolve(dirname(fileURLToPath(import.meta.url)), "../drizzle");

await migrate(db, { migrationsFolder: folder });
await sql.end();
console.log("✓ Migração aplicada.");
