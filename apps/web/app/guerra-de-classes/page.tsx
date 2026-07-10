import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PageShell } from "@/components/page-shell";
import { GuerraDeClassesClient } from "@/components/guerra-de-classes-client";

export const metadata: Metadata = { title: "Guerra de Classes" };
export const dynamic = "force-dynamic";

export default async function GuerraDeClassesPage() {
  await requireUser();
  return (
    <PageShell titulo="Guerra de Classes">
      <GuerraDeClassesClient />
    </PageShell>
  );
}
