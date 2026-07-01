import type { Database } from "@rise/db";

/**
 * Contexto de requisição do tRPC. `userId` vem da verificação do JWT do Supabase
 * Auth (adaptador HTTP — a construir). A autorização acontece na camada de app
 * (procedures), com RLS como defense-in-depth (doc 07/08).
 */
export interface Context {
  db: Database;
  userId: string | null;
}

export interface CreateContextOptions {
  db: Database;
  userId: string | null;
}

export function createContext(opts: CreateContextOptions): Context {
  return { db: opts.db, userId: opts.userId };
}
