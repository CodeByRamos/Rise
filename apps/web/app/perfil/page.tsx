import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PageShell } from "@/components/page-shell";
import { PerfilClient } from "@/components/perfil-client";

export const metadata: Metadata = { title: "Perfil" };
export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  await requireUser();
  return (
    <PageShell titulo="Seu perfil">
      <PerfilClient />
    </PageShell>
  );
}
