import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PageShell } from "@/components/page-shell";
import { EstatisticasClient } from "@/components/estatisticas-client";

export const metadata: Metadata = { title: "Estatísticas" };
export const dynamic = "force-dynamic";

export default async function EstatisticasPage() {
  await requireUser();
  return (
    <PageShell titulo="Estatísticas">
      <EstatisticasClient />
    </PageShell>
  );
}
