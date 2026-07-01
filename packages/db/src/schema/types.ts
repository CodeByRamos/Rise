import { customType } from "drizzle-orm/pg-core";

/**
 * citext — texto case-insensitive (email, @handle). Requer `CREATE EXTENSION citext`
 * na migração inicial. Ver docs/08-banco-de-dados.md §3.
 */
export const citext = customType<{ data: string }>({
  dataType() {
    return "citext";
  },
});
