import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PageShell } from "@/components/page-shell";
import { CoachClient } from "@/components/coach-client";

export const metadata: Metadata = { title: "Coach" };
export const dynamic = "force-dynamic";

export default async function CoachPage() {
  await requireUser();
  return (
    <PageShell titulo="Coach">
      <CoachClient />
    </PageShell>
  );
}
