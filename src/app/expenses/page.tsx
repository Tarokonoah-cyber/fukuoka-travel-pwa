import { ExpensesPageClient } from "@/components/ExpensesPageClient";
import { hasTravelSession, isAuthConfigured } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  return <ExpensesPageClient initialAuthenticated={await hasTravelSession()} authConfigured={isAuthConfigured()} />;
}
