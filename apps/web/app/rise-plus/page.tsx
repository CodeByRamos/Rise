import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PlanosClient } from "@/components/planos-client";

export const metadata: Metadata = {
  title: "Rise+",
  description:
    "A vida é grátis. A inteligência é Rise+. Coach ilimitado, Análise Profunda semanal e estatísticas profundas — nunca vantagem competitiva.",
};
export const dynamic = "force-dynamic";

export default async function RisePlusPage() {
  await requireUser();
  return <PlanosClient />;
}
