import { readFile } from "node:fs/promises";
import nextEnv from "@next/env";
import { neon } from "@neondatabase/serverless";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("缺少 DATABASE_URL，migration 未執行。");
  process.exit(1);
}

const migrationUrl = new URL("../migrations/20260713_create_travel_expenses.sql", import.meta.url);
const migration = await readFile(migrationUrl, "utf8");
const sql = neon(databaseUrl);

try {
  await sql.query(migration);
  const [table] = await sql`select to_regclass('public.travel_expenses')::text as name`;
  const indexes = await sql`
    select indexname
    from pg_indexes
    where schemaname = 'public' and tablename = 'travel_expenses'
    order by indexname
  `;
  if (table?.name !== "travel_expenses") throw new Error("MIGRATION_VERIFICATION_FAILED");
  console.log(`travel_expenses migration 執行完成；已驗證資料表與 ${indexes.length} 個 index。`);
} catch {
  console.error("travel_expenses migration 執行失敗；請檢查資料庫連線與權限。");
  process.exit(1);
}
