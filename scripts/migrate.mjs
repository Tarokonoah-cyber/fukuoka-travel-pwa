import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

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
  console.log("travel_expenses migration 執行完成。");
} catch {
  console.error("travel_expenses migration 執行失敗；請檢查資料庫連線與權限。");
  process.exit(1);
}
