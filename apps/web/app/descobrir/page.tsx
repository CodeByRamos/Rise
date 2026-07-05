import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PageShell } from "@/components/page-shell";
import { DescobrirClient } from "@/components/descobrir-client";

export const metadata: Metadata = { title: "Descobrir" };
export const dynamic = "force-dynamic";

export default async function DescobrirPage() {
  await requireUser();
  return (
    <PageShell titulo="Descobrir pessoas">
      <DescobrirClient />
    </PageShell>
  );
}
