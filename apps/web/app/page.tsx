import { DashboardClient } from "@/components/dashboard-client";

// Server shell — a interação vive no client component (optimistic UI via @rise/core).
export default function Home() {
  return <DashboardClient />;
}
