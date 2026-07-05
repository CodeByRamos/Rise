import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PageShell } from "@/components/page-shell";
import { LigasClient } from "@/components/ligas-client";

export const metadata: Metadata = { title: "Ligas" };
export const dynamic = "force-dynamic";

export default async function LigasPage() {
  await requireUser();
  return (
    <PageShell titulo="Liga da semana">
      <LigasClient />
    </PageShell>
  );
}
