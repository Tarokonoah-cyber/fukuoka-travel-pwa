import "server-only";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let sqlClient: NeonQueryFunction<false, false> | null = null;

export function getExpenseSql() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_NOT_CONFIGURED");
  if (!sqlClient) sqlClient = neon(databaseUrl, { fetchOptions: { cache: "no-store" } });
  return sqlClient;
}
