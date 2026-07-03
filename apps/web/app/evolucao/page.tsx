import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PageShell } from "@/components/page-shell";
import { EvolucaoClient } from "@/components/evolucao-client";

export const metadata: Metadata = { title: "Evolução" };
export const dynamic = "force-dynamic";

export default async function EvolucaoPage() {
  await requireUser();
  return (
    <PageShell titulo="Árvore de Habilidade">
      <EvolucaoClient />
    </PageShell>
  );
}
