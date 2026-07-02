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
  // Supabase (pooler/direct) exige SSL; local sem TLS não usa.
  const usaSsl = /supabase\.(co|com)/.test(connectionString);
  const client = postgres(connectionString, {
    prepare: false,
    // Pool enxuto: em serverless cada instância vive pouco; pools grandes
    // estouram o limite do pooler do Supabase (ex.: session mode = 15 clients).
    max: 4,
    ...(usaSsl ? { ssl: "require" as const } : {}),
  });
  return drizzle(client, { schema });
}

export type Database = ReturnType<typeof createDb>;

/**
 * Singleton por processo: um único client/pool por instância do servidor.
 * Sem isto, cada request criaria um pool novo e esgotaria o pooler.
 */
const globalForDb = globalThis as unknown as { __riseDb?: Database };
export function getDb(): Database {
  return (globalForDb.__riseDb ??= createDb());
}

export { schema };
