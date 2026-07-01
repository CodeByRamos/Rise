/**
 * Seed do catálogo de Áreas da Vida (`life_area_catalog`).
 * Idempotente (onConflictDoNothing). Rode com um DATABASE_URL válido:
 *   pnpm --filter @rise/db db:seed
 */
import { createDb } from "../client";
import { lifeAreaCatalog } from "../schema";
import { LIFE_AREA_CATALOG } from "./life-area-catalog";

async function main() {
  const db = createDb();
  for (const a of LIFE_AREA_CATALOG) {
    await db
      .insert(lifeAreaCatalog)
      .values({
        id: a.id,
        namePt: a.namePt,
        nameEn: a.nameEn,
        colorToken: a.colorToken,
        icon: a.icon,
        // base por tipo de ação; para Fase 1 usamos um valor por área.
        baseXpTable: { quick_log: a.baseXp, habit_check: a.baseXp },
        isDefault: true,
      })
      .onConflictDoNothing();
  }
  console.log(`Seed OK — ${LIFE_AREA_CATALOG.length} Áreas da Vida no catálogo.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Falha no seed:", err);
    process.exit(1);
  });
