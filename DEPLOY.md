# Deploy do Rise (Vercel)

O repositório já está pronto para deploy: monorepo pnpm detectado automaticamente, `apps/web/vercel.json` fixa as funções em **São Paulo (gru1)** — mesma região do Supabase (`sa-east-1`), latência mínima com o banco.

## Passo a passo (uma vez só — depois todo push na `main` deploya sozinho)

1. Acesse **[vercel.com/new](https://vercel.com/new)** e entre **com o GitHub** (mesma conta `CodeByRamos`).
2. Em "Import Git Repository", escolha **`CodeByRamos/Rise`** → **Import**.
3. Em **Root Directory**, clique em *Edit* e selecione **`apps/web`**. (Framework: Next.js — detectado sozinho.)
4. Abra **Environment Variables** e cole as 4 variáveis abaixo — os valores estão no seu arquivo local **`apps/web/.env.local`** (copie e cole cada um):
   | Nome | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | (do .env.local) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (do .env.local) |
   | `SUPABASE_SERVICE_ROLE_KEY` | (do .env.local — marque como *Sensitive*) |
   | `DATABASE_URL` | (do .env.local — **copie exatamente**, a senha já está URL-encodada) |
5. Clique **Deploy**. Em ~2 minutos o Rise estará no ar em `https://<projeto>.vercel.app`.

## Depois do primeiro deploy

- **URL de produção no Supabase Auth:** em Supabase → Authentication → URL Configuration, adicione a URL do Vercel em *Site URL* e *Redirect URLs* (para o login funcionar em produção).
- Todo `git push origin main` gera deploy automático; PRs ganham preview deploys.

## Solução de problemas

- **Build falha por pnpm:** o campo `packageManager` no package.json raiz já fixa `pnpm@9.15.0` — o Vercel respeita. Se pedir, defina *Install Command* = `pnpm install`.
- **Erro de banco em runtime:** confira se a `DATABASE_URL` usa o **pooler** (host `*.pooler.supabase.com`) e se a senha está URL-encodada (sem `[` `]`).
