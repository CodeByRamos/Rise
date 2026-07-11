import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PageShell } from "@/components/page-shell";
import { FocoClient } from "@/components/foco-client";

export const metadata: Metadata = { title: "Foco" };
export const dynamic = "force-dynamic";

export default async function FocoPage() {
  await requireUser();
  return (
    <PageShell titulo="Foco">
      <FocoClient />
    </PageShell>
  );
}
