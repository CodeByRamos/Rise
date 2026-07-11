-- Sequência GLOBAL (life_area_id IS NULL) precisa ser única por usuário.
-- O unique composto (user_id, life_area_id) não cobre NULL (Postgres trata
-- NULLs como distintos), então duas primeiras-ações concorrentes criavam
-- duas linhas globais e o streak flutuava entre leituras (.limit(1) sem
-- ORDER BY). Antes de criar o índice, colapsa duplicatas existentes
-- preservando a linha de MAIOR current_count (a mais "verdadeira").
WITH ranqueadas AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY user_id
           ORDER BY current_count DESC, longest_count DESC, updated_at DESC
         ) AS rn
  FROM streaks
  WHERE life_area_id IS NULL
)
DELETE FROM streaks
WHERE id IN (SELECT id FROM ranqueadas WHERE rn > 1);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "streaks_user_global_uq"
  ON "streaks" ("user_id")
  WHERE "life_area_id" IS NULL;
