# Setup do Rise — passo a passo completo

Guia único para deixar o Rise 100% funcional (local + produção). Siga na ordem; cada passo diz onde é feito (terminal, painel do Supabase ou Vercel).

---

## 0. Pré-requisitos

- **Node 20+** instalado (`node -v`).
- pnpm via corepack (já vem com o Node — não precisa instalar nada):
  ```powershell
  corepack pnpm -v   # deve imprimir 9.15.0
  ```
- Conta no [supabase.com](https://supabase.com) com um projeto criado (região `sa-east-1` recomendada).

---

## 1. Variáveis de ambiente

### 1.1 `apps/web/.env.local` (app web)

Copie o modelo e preencha com os valores do painel do Supabase (**Settings → API**):

```powershell
Copy-Item apps/web/.env.example apps/web/.env.local
```

| Variável | Onde pegar |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API → `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → `service_role` (**nunca** expor no cliente) |
| `DATABASE_URL` | Settings → Database → Connection string → **Transaction pooler** (porta **6543**). Senha URL-encodada (sem `[` `]`) |

### 1.2 `packages/db/.env` (migrações e seed)

```powershell
Copy-Item packages/db/.env.example packages/db/.env
```

Mesma `DATABASE_URL`, **mas com a conexão direta (porta 5432)** — drizzle-kit não usa o pooler:

```
DATABASE_URL="postgresql://postgres:[SENHA]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

---

## 2. Banco de dados — migrações

Aplica todas as migrações (0000 → 0011). Idempotente: já aplicadas são puladas.

```powershell
corepack pnpm --filter @rise/db db:migrate
```

> Migrações recentes que **precisam** estar aplicadas para as features novas:
> - `0009` — `profiles.main_class_id` (Classe principal)
> - `0010` — `profiles.main_class_since` (anti-exploit da Guerra de Classes)
> - `0011` — `season_claims` (Temporada Solo)

## 3. Banco de dados — seed dos catálogos

Popula as **30 Áreas da Vida** e os **9 cosméticos da Loja** (sem isso a Loja fica vazia). Idempotente — pode rodar quantas vezes quiser.

```powershell
corepack pnpm --filter @rise/db db:seed
```

---

## 4. Supabase Auth

No painel: **Authentication → Providers → Email** → habilite **Email + senha** (o app usa `signInWithPassword`).

Em **Authentication → URL Configuration**:
- *Site URL*: `http://localhost:3000` (dev) — depois troque/adicione a URL do Vercel.
- *Redirect URLs*: adicione `http://localhost:3000/**` e depois `https://<seu-projeto>.vercel.app/**`.

---

## 5. Supabase Storage — 2 buckets

No painel: **Storage → New bucket**. Crie exatamente estes dois:

| Bucket | Público? | Uso |
|---|---|---|
| `avatars` | **Sim (public)** | foto de perfil (URL pública direta) |
| `provas` | **Não (private)** | fotos de prova das ações (URL assinada, 1h) |

### 5.1 Policies dos buckets (SQL Editor)

Cole no **SQL Editor** do Supabase e execute (os uploads gravam em `<uid>/arquivo`, a policy tranca cada usuário na própria pasta):

```sql
-- avatars: leitura pública, upload só na própria pasta
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_owner_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- provas: privado — dono lê (via URL assinada) e grava só na própria pasta
create policy "provas_owner_read"
  on storage.objects for select to authenticated
  using (bucket_id = 'provas' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "provas_owner_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'provas' and (storage.foldername(name))[1] = auth.uid()::text);
```

---

## 6. Rodar localmente

```powershell
corepack pnpm install
corepack pnpm --filter @rise/web dev
```

Abra `http://localhost:3000` → crie uma conta → o bootstrap cria perfil, carteira e as 6 Áreas iniciais sozinho.

**Smoke test (2 min):** registrar uma ação com nota → +XP e toast → conferir heatmap em `/evolucao` → escolher Classe em `/perfil` → ver `/guerra-de-classes` → comprar item na `/loja` (após ganhar Faíscas nas missões) → trilha da Temporada na Home.

---

## 7. Deploy (Vercel)

Já documentado em [DEPLOY.md](DEPLOY.md) — resumo: importe `CodeByRamos/Rise` no Vercel, Root Directory `apps/web`, cole as 4 env vars do `.env.local`, Deploy. Depois adicione a URL de produção no Supabase Auth (passo 4).

---

## 8. Checklist final

- [ ] `.env.local` (web) e `.env` (db) preenchidos
- [ ] `db:migrate` rodado sem erro (12 migrações)
- [ ] `db:seed` rodado (30 áreas + 9 cosméticos)
- [ ] Email+senha habilitado no Supabase Auth
- [ ] Buckets `avatars` (público) e `provas` (privado) criados com as 4 policies
- [ ] Login + registro de ação funcionando local
- [ ] Deploy Vercel com as 4 env vars + Site URL de produção no Auth

## Ainda não precisa configurar (fases futuras)

- **Stripe** (Premium/billing — Sprint 7): sem chaves, o app roda 100% no tier Free.
- **Resend / push** (e-mail e notificações nativas — Sprint 6): notificações in-app já funcionam sem nada.
- **PostHog / Sentry** (observabilidade): opcionais, o app não depende deles.
