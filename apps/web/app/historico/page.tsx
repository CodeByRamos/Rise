import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PageShell } from "@/components/page-shell";
import { HistoricoClient } from "@/components/historico-client";

export const metadata: Metadata = { title: "Histórico" };
export const dynamic = "force-dynamic";

export default async function HistoricoPage() {
  await requireUser();
  return (
    <PageShell titulo="Histórico">
      <HistoricoClient />
    </PageShell>
  );
}
