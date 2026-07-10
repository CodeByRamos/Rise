import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PageShell } from "@/components/page-shell";
import { NotificacoesClient } from "@/components/notificacoes-client";
import { PushToggle } from "@/components/push-toggle";

export const metadata: Metadata = { title: "Notificações" };
export const dynamic = "force-dynamic";

export default async function NotificacoesPage() {
  await requireUser();
  return (
    <PageShell titulo="Notificações">
      <PushToggle />
      <NotificacoesClient />
    </PageShell>
  );
}
