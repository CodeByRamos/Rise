/**
 * Seed dos catálogos: Áreas da Vida (`life_area_catalog`) + cosméticos
 * (`cosmetic_items` — sem ele a Loja nasce vazia).
 * Idempotente (onConflictDoNothing). Rode com um DATABASE_URL válido:
 *   pnpm --filter @rise/db db:seed
 */
import { createDb } from "../client";
import { lifeAreaCatalog, cosmeticItems } from "../schema";
import { LIFE_AREA_CATALOG } from "./life-area-catalog";
import { COSMETIC_CATALOG } from "./cosmetics";

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

  for (const c of COSMETIC_CATALOG) {
    await db
      .insert(cosmeticItems)
      .values({
        id: c.id,
        name: c.name,
        kind: c.kind,
        priceSparks: c.priceSparks,
        preview: c.preview,
        isActive: true,
      })
      .onConflictDoNothing();
  }
  console.log(`Seed OK — ${COSMETIC_CATALOG.length} cosméticos na Loja.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Falha no seed:", err);
    process.exit(1);
  });
