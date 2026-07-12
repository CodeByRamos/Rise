import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PageShell } from "@/components/page-shell";
import { PlanejarClient } from "@/components/planejar-client";

export const metadata: Metadata = { title: "Planejamento" };
export const dynamic = "force-dynamic";

export default async function PlanejamentoPage() {
  await requireUser();
  return (
    <PageShell titulo="Planejamento">
      <PlanejarClient />
    </PageShell>
  );
}
