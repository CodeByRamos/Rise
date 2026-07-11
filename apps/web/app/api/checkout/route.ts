import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  criarCheckout,
  stripeConfigurado,
  type PlanoCobravel,
} from "@/lib/billing";

export const runtime = "nodejs";

const PLANOS: PlanoCobravel[] = ["plus_mensal", "plus_anual", "founder"];

/**
 * Inicia o checkout do Rise+. Retorna `{ url }` para redirecionar ao Stripe, ou
 * `{ configured:false }` quando o billing ainda não foi configurado (CTA honesto,
 * sem prometer o que não entrega).
 */
export async function POST(req: Request) {
  if (!stripeConfigurado()) {
    return NextResponse.json({ configured: false as const }, { status: 200 });
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.json(
      { error: "É necessário estar logado." },
      { status: 401 },
    );
  }

  let plano: string | undefined;
  try {
    plano = (await req.json())?.plano;
  } catch {
    plano = undefined;
  }
  if (!plano || !PLANOS.includes(plano as PlanoCobravel)) {
    return NextResponse.json({ error: "Plano inválido." }, { status: 400 });
  }

  try {
    const url = await criarCheckout({
      plano: plano as PlanoCobravel,
      userId: data.user.id,
      email: data.user.email ?? null,
      origin: new URL(req.url).origin,
    });
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha ao iniciar o checkout." },
      { status: 502 },
    );
  }
}
