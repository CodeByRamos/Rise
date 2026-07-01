import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Cria o client Drizzle a partir de uma connection string (Supabase Postgres).
 *
 * Lazy de propósito: NÃO conecta no import — só quando `createDb()` é chamado.
 * Isso mantém typecheck/build sem exigir banco, e centraliza a validação do
 * segredo. Em serverless usar o pooler do Supabase (porta 6543) com `prepare: false`.
 */
export function createDb(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL não definido — configure o Postgres do Supabase (ver packages/db/.env.example).",
    );
  }
  const client = postgres(connectionString, { prepare: false });
  return drizzle(client, { schema });
}

export type Database = ReturnType<typeof createDb>;
export { schema };
