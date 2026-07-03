import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PageShell } from "@/components/page-shell";
import { FeedClient } from "@/components/feed-client";

export const metadata: Metadata = { title: "Feed" };
export const dynamic = "force-dynamic";

export default async function FeedPage() {
  await requireUser();
  return (
    <PageShell titulo="Feed de evolução">
      <FeedClient />
    </PageShell>
  );
}
