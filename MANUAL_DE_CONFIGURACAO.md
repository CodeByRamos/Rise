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

## 2. Migração de banco `0014` — tabela `coach_analyses`

> Necessária para a **Análise Profunda semanal** (Coach Opus, Rise+) — guarda uma
> análise por semana por usuário para não recobrar o Opus a cada releitura.

- **O que preciso configurar:** aplicar `packages/db/drizzle/0014_amazing_dragon_man.sql`.
- **Onde configurar:** Supabase → SQL Editor (ou `corepack pnpm --filter @rise/db migrate`).
- **Quais informações preciso obter:** nenhuma — só acesso ao banco.
- **Onde inserir:** cole o SQL no editor e execute (cria a tabela + índices).
- **Como verificar:**
  ```sql
  select 1 from information_schema.tables where table_name = 'coach_analyses';
  ```
  Deve retornar 1 linha. Sendo Premium, o botão "Gerar minha primeira análise" em
  **Evolução → Análise Profunda** deve funcionar sem erro.

---

## 3. Coach de IA — chave da Anthropic (`ANTHROPIC_API_KEY`)

> Já usada pelo Coach diário; a Análise Profunda semanal usa o modelo Opus.

- **O que preciso configurar:** a variável `ANTHROPIC_API_KEY`.
- **Onde configurar:** `.env.local` do `apps/web` (local) e nas **Environment Variables**
  do projeto na Vercel (produção).
- **Quais informações preciso obter:** uma API key em <https://console.anthropic.com/> →
  *API Keys*.
- **Onde inserir:** `ANTHROPIC_API_KEY="sk-ant-..."`.
- **Como verificar:** o check-in do Coach na Home deixa de cair na resposta heurística e,
  sendo Premium, a Análise Profunda gera texto. Sem a chave, o app segue funcionando (o
  Coach usa a camada heurística e a Análise Profunda avisa que está indisponível).

---

## 4. Billing Rise+ — Stripe (assinaturas e Founder)

> Ativa a cobrança do Rise+. **Todo o app funciona 100% no plano Free sem isto** — só o
> checkout de pagamento fica inativo (o botão "Assinar" mostra um aviso honesto de "em
> breve"). Nenhuma dependência nova foi adicionada: o código fala com a API REST do Stripe.

### 4.1 Criar produtos e preços no Stripe
- **Onde:** <https://dashboard.stripe.com/> → *Products*.
- **Quais informações preciso obter (crie 3 preços e copie os `price_...`):**
  - **Rise+ Mensal** — recorrente, R$ 29,90/mês → `STRIPE_PRICE_PLUS_MONTHLY`.
  - **Rise+ Anual** — recorrente, R$ 199/ano → `STRIPE_PRICE_PLUS_ANNUAL`.
  - **Rise Founder** — preço **único** (one-time), R$ 299 → `STRIPE_PRICE_FOUNDER`.

### 4.2 Chaves de API e webhook
- **Chave secreta:** *Developers → API keys* → copie a **Secret key** (`sk_live_...` ou
  `sk_test_...`) → `STRIPE_SECRET_KEY`.
- **Webhook:** *Developers → Webhooks → Add endpoint*:
  - **Endpoint URL:** `https://<seu-dominio>/api/stripe/webhook`
  - **Eventos a escutar:** `checkout.session.completed`,
    `customer.subscription.updated`, `customer.subscription.deleted`.
  - Após criar, copie o **Signing secret** (`whsec_...`) → `STRIPE_WEBHOOK_SECRET`.

### 4.3 Onde inserir as variáveis
No `.env.local` do `apps/web` (local) e nas Environment Variables da Vercel (produção):
```
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_PLUS_MONTHLY="price_..."
STRIPE_PRICE_PLUS_ANNUAL="price_..."
STRIPE_PRICE_FOUNDER="price_..."
```

### 4.4 Como verificar
1. Com as variáveis setadas, abra **/rise-plus** e clique **Assinar** num plano — deve
   redirecionar ao checkout do Stripe (use um cartão de teste `4242 4242 4242 4242` em
   modo test).
2. Concluído o pagamento, o webhook grava `users.plan`; volte ao app: **Perfil** mostra
   o plano ativo e a Análise Profunda fica liberada.
3. Teste o webhook localmente com `stripe listen --forward-to localhost:3000/api/stripe/webhook`
   (Stripe CLI). O endpoint deve responder `200 {received:true}` em eventos válidos e
   `400` em assinatura inválida.
- **Cancelamento:** ao cancelar no Stripe, o evento `customer.subscription.deleted` volta
  o usuário para `free` **sem apagar** XP, níveis, conquistas ou histórico.

---
</content>
</invoke>
