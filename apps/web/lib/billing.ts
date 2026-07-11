import crypto from "node:crypto";

/**
 * Billing via Stripe usando a REST API direta (fetch + crypto nativos) — sem
 * adicionar dependência (IDEA.md). Tudo aqui é DORMENTE sem as chaves: o app
 * roda 100% no tier Free até você configurar o Stripe (ver
 * MANUAL_DE_CONFIGURACAO.md §2). A progressão nunca depende disto.
 */

export type PlanoCobravel = "plus_mensal" | "plus_anual" | "founder";

const STRIPE_API = "https://api.stripe.com/v1";

export function stripeConfigurado(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** Price ID (do painel Stripe) por plano — configurado por env. */
function priceIdDe(plano: PlanoCobravel): string | undefined {
  switch (plano) {
    case "plus_mensal":
      return process.env.STRIPE_PRICE_PLUS_MONTHLY;
    case "plus_anual":
      return process.env.STRIPE_PRICE_PLUS_ANNUAL;
    case "founder":
      return process.env.STRIPE_PRICE_FOUNDER;
  }
}

/** Plano de entitlement (users.plan) que cada compra concede. */
function planTierDe(plano: PlanoCobravel): "plus" | "founder" {
  return plano === "founder" ? "founder" : "plus";
}

function form(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
}

async function stripePost(
  path: string,
  params: Record<string, string>,
): Promise<Record<string, unknown>> {
  const res = await fetch(`${STRIPE_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form(params),
  });
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    const err = json.error as { message?: string } | undefined;
    throw new Error(err?.message ?? `Stripe ${res.status}`);
  }
  return json;
}

/**
 * Cria a Checkout Session e devolve a URL de pagamento. Founder é pagamento
 * único (vitalício); os demais são assinatura. `user_id` viaja em metadata (na
 * sessão E na assinatura) para o webhook religar compra→usuário sem tabela extra.
 */
export async function criarCheckout(opts: {
  plano: PlanoCobravel;
  userId: string;
  email: string | null;
  origin: string;
}): Promise<string> {
  const price = priceIdDe(opts.plano);
  if (!price) {
    throw new Error(`Preço do plano "${opts.plano}" não configurado no Stripe.`);
  }
  const tier = planTierDe(opts.plano);
  const modo = opts.plano === "founder" ? "payment" : "subscription";

  const params: Record<string, string> = {
    mode: modo,
    "line_items[0][price]": price,
    "line_items[0][quantity]": "1",
    client_reference_id: opts.userId,
    "metadata[user_id]": opts.userId,
    "metadata[plan]": tier,
    success_url: `${opts.origin}/perfil?assinatura=ativa`,
    cancel_url: `${opts.origin}/rise-plus?checkout=cancelado`,
    allow_promotion_codes: "true",
  };
  if (opts.email) params.customer_email = opts.email;
  if (modo === "subscription") {
    params["subscription_data[metadata][user_id]"] = opts.userId;
    params["subscription_data[metadata][plan]"] = tier;
    params["subscription_data[trial_period_days]"] = "7"; // trial sem cartão-surpresa
  }

  const session = await stripePost("/checkout/sessions", params);
  const url = session.url as string | undefined;
  if (!url) throw new Error("Stripe não retornou a URL de checkout.");
  return url;
}

/**
 * Verifica a assinatura do webhook (esquema `t=…,v1=…`, HMAC-SHA256) e devolve o
 * evento. Rejeita payload adulterado ou fora da janela de tolerância (5 min).
 */
export function verificarWebhook(
  payload: string,
  header: string | null,
  secret = process.env.STRIPE_WEBHOOK_SECRET,
): { type: string; data: { object: Record<string, unknown> } } {
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET não configurado.");
  if (!header) throw new Error("Assinatura ausente.");

  const partes = Object.fromEntries(
    header.split(",").map((kv) => kv.split("=") as [string, string]),
  );
  const t = partes.t;
  const v1 = partes.v1;
  if (!t || !v1) throw new Error("Assinatura malformada.");

  const esperado = crypto
    .createHmac("sha256", secret)
    .update(`${t}.${payload}`)
    .digest("hex");
  const ok =
    esperado.length === v1.length &&
    crypto.timingSafeEqual(Buffer.from(esperado), Buffer.from(v1));
  if (!ok) throw new Error("Assinatura inválida.");

  // Anti-replay: rejeita eventos com mais de 5 min.
  const idade = Math.abs(Date.now() / 1000 - Number(t));
  if (idade > 300) throw new Error("Evento fora da janela de tolerância.");

  return JSON.parse(payload);
}

/** Mapeia um evento de assinatura Stripe para o plano de entitlement resultante. */
export function planoDoEvento(evento: {
  type: string;
  data: { object: Record<string, unknown> };
}): { userId: string; plan: "free" | "plus" | "founder" } | null {
  const obj = evento.data.object;
  const metadata = (obj.metadata as Record<string, string> | undefined) ?? {};
  const userId =
    metadata.user_id ?? (obj.client_reference_id as string | undefined);
  if (!userId) return null;

  switch (evento.type) {
    case "checkout.session.completed":
      // Só concede após pagamento confirmado (mode payment) ou trial/assinatura ok.
      if (obj.payment_status === "unpaid" && obj.mode === "payment") return null;
      return {
        userId,
        plan: (metadata.plan as "plus" | "founder") ?? "plus",
      };
    case "customer.subscription.deleted":
      return { userId, plan: "free" };
    case "customer.subscription.updated": {
      const status = obj.status as string;
      // Assinatura morta (cancelada/inadimplente) → volta a Free, sem perder dados.
      if (["canceled", "unpaid", "incomplete_expired"].includes(status)) {
        return { userId, plan: "free" };
      }
      return { userId, plan: (metadata.plan as "plus") ?? "plus" };
    }
    default:
      return null;
  }
}
