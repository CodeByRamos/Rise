# Manual de Configuração — Rise

Este arquivo lista **tudo que depende de configuração manual sua** (chaves, migrações,
serviços externos). O código já está pronto para consumir cada item — falta apenas
você provisionar/configurar e colar os valores nos lugares indicados.

Cada item segue o formato: **o que**, **onde**, **o que obter**, **onde inserir**, **como verificar**.

---

## 1. Migração de banco `0013` — índice único da sequência global

> Necessário para o registro de ação funcionar sem duplicar a sequência (streak) global.

- **O que preciso configurar:** aplicar a migração `packages/db/drizzle/0013_streaks-global-unique.sql`
  no banco Supabase (produção e qualquer ambiente ativo). Ela colapsa sequências globais
  duplicadas e cria o índice único parcial `streaks_user_global_uq`.
- **Onde configurar:** Supabase → projeto Rise → **SQL Editor** (ou via `drizzle-kit`/`psql`
  com a connection string do projeto).
- **Quais informações preciso obter:** nenhuma nova — só acesso ao SQL Editor do projeto.
- **Onde inserir:** cole o conteúdo do arquivo `.sql` no SQL Editor e execute. Alternativa:
  ```
  corepack pnpm --filter @rise/db migrate
  ```
  (usa a `DATABASE_URL` do `.env` — veja `SETUP.md`).
- **Como verificar:** rode no SQL Editor
  ```sql
  select indexname from pg_indexes where indexname = 'streaks_user_global_uq';
  ```
  Deve retornar 1 linha. Depois disso, registrar duas ações rápidas seguidas não deve
  mais gerar erro nem "piscar" o número da sequência.

---
</content>
</invoke>
