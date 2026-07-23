import { readFile } from "node:fs/promises";
import nextEnv from "@next/env";
import { neon } from "@neondatabase/serverless";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("Missing DATABASE_URL; migration was not executed.");
  process.exit(1);
}

const migrationUrls = [
  new URL("../migrations/20260713_create_travel_expenses.sql", import.meta.url),
  new URL("../migrations/20260713_create_travel_item_state.sql", import.meta.url),
  new URL("../migrations/20260713_create_travel_day_plan_state.sql", import.meta.url),
  new URL("../migrations/20260718_create_food_candidates.sql", import.meta.url),
  new URL("../migrations/20260722_add_travel_item_recommendation_fields.sql", import.meta.url),
];

const expectedTables = [
  "travel_day_plan_state",
  "travel_expenses",
  "travel_food_candidates",
  "travel_item_state",
];
const expectedIndexes = [
  "travel_day_plan_state_date_order_idx",
  "travel_expenses_created_at_idx",
  "travel_expenses_expense_date_idx",
  "travel_expenses_receipt_hash_idx",
  "travel_food_candidates_updated_at_idx",
  "travel_item_state_updated_at_idx",
];

const sql = neon(databaseUrl);
let phase = "initialization";
const assert = (condition, message) => {
  if (!condition) throw new Error(`CATALOG_ASSERTION_FAILED:${message}`);
};

try {
  for (const migrationUrl of migrationUrls) {
    phase = `migration:${migrationUrl.pathname.split("/").at(-1)}`;
    const statements = (await readFile(migrationUrl, "utf8"))
      .split(/^-- statement-breakpoint\s*$/m)
      .map((statement) => statement.trim())
      .filter(Boolean);
    for (const [index, statement] of statements.entries()) {
      phase = `migration:${migrationUrl.pathname.split("/").at(-1)}:${index + 1}`;
      await sql.query(statement);
    }
  }

  phase = "catalog:tables";
  const tables = await sql`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_name in ('travel_expenses', 'travel_food_candidates', 'travel_item_state', 'travel_day_plan_state')
    order by table_name
  `;
  assert(
    JSON.stringify(tables.map(({ table_name }) => table_name)) === JSON.stringify(expectedTables),
    "tables",
  );

  phase = "catalog:columns";
  const columns = await sql`
    select table_name, column_name, data_type, is_nullable
    from information_schema.columns
    where table_schema = 'public'
      and table_name in ('travel_expenses', 'travel_food_candidates', 'travel_item_state', 'travel_day_plan_state')
  `;
  const column = (tableName, columnName) =>
    columns.find(
      (entry) => entry.table_name === tableName && entry.column_name === columnName,
    );
  assert(column("travel_expenses", "ai_raw_result")?.data_type === "jsonb", "expenses-jsonb");
  assert(column("travel_food_candidates", "payload")?.data_type === "jsonb", "food-jsonb");
  assert(column("travel_expenses", "updated_at")?.data_type === "timestamp with time zone", "expenses-updated-at");
  assert(column("travel_item_state", "updated_at")?.data_type === "timestamp with time zone", "state-updated-at");
  assert(column("travel_item_state", "custom_note")?.data_type === "text", "state-custom-note");
  assert(column("travel_item_state", "custom_source_url")?.data_type === "text", "state-custom-source-url");
  assert(column("travel_day_plan_state", "updated_at")?.data_type === "timestamp with time zone", "day-plan-updated-at");
  assert(
    !columns.some(({ column_name }) => /(image|base64|blob)/i.test(column_name)),
    "no-receipt-image-columns",
  );

  phase = "catalog:constraints";
  const constraints = await sql`
    select
      c.conrelid::regclass::text as table_name,
      c.contype,
      pg_get_constraintdef(c.oid) as definition
    from pg_constraint c
    where c.connamespace = 'public'::regnamespace
      and c.conrelid in (
        'public.travel_expenses'::regclass,
        'public.travel_food_candidates'::regclass,
        'public.travel_item_state'::regclass,
        'public.travel_day_plan_state'::regclass
      )
  `;
  const definitions = (tableName, type) =>
    constraints
      .filter(({ table_name, contype }) => table_name === tableName && contype === type)
      .map(({ definition }) => definition);
  assert(definitions("travel_expenses", "p").some((value) => /PRIMARY KEY \(id\)/.test(value)), "expenses-pk");
  assert(definitions("travel_food_candidates", "p").some((value) => /PRIMARY KEY \(id\)/.test(value)), "food-pk");
  assert(definitions("travel_item_state", "p").some((value) => /PRIMARY KEY \(namespace, item_id\)/.test(value)), "state-pk");
  assert(definitions("travel_day_plan_state", "p").some((value) => /PRIMARY KEY \(travel_date, item_id\)/.test(value)), "day-plan-pk");

  const expenseChecks = definitions("travel_expenses", "c").join("\n");
  for (const token of ["amount_jpy", "amount_twd", "category", "payment_method", "input_method"]) {
    assert(expenseChecks.includes(token), `expenses-check-${token}`);
  }
  const stateChecks = definitions("travel_item_state", "c").join("\n");
  assert(stateChecks.includes("namespace"), "state-namespace-check");
  assert(stateChecks.includes("custom_name") && stateChecks.includes("custom_category"), "state-custom-check");
  assert(stateChecks.includes("custom_note") && stateChecks.includes("custom_source_url"), "state-recommendation-custom-check");
  const dayPlanChecks = definitions("travel_day_plan_state", "c").join("\n");
  assert(dayPlanChecks.includes("status"), "day-plan-status-check");
  assert(dayPlanChecks.includes("custom_title") && dayPlanChecks.includes("is_custom"), "day-plan-custom-check");
  assert(dayPlanChecks.includes("custom_start_time"), "day-plan-time-check");

  phase = "catalog:indexes";
  const indexes = await sql`
    select indexname, indexdef
    from pg_indexes
    where schemaname = 'public'
      and tablename in ('travel_expenses', 'travel_food_candidates', 'travel_item_state', 'travel_day_plan_state')
  `;
  for (const indexName of expectedIndexes) {
    assert(indexes.some(({ indexname }) => indexname === indexName), `index-${indexName}`);
  }
  assert(
    indexes.find(({ indexname }) => indexname === "travel_expenses_receipt_hash_idx")?.indexdef.includes("WHERE (receipt_hash IS NOT NULL)"),
    "receipt-hash-partial-index",
  );

  phase = "catalog:triggers";
  const triggers = await sql`
    select t.tgname, p.prosecdef
    from pg_trigger t
    join pg_proc p on p.oid = t.tgfoid
    where t.tgrelid = 'public.travel_expenses'::regclass
      and not t.tgisinternal
  `;
  const updatedAtTrigger = triggers.find(
    ({ tgname }) => tgname === "travel_expenses_set_updated_at",
  );
  assert(Boolean(updatedAtTrigger), "expenses-updated-at-trigger");
  assert(updatedAtTrigger?.prosecdef === false, "trigger-function-not-security-definer");

  console.log(
    `Migration and catalog verification passed: ${tables.length} tables, ${constraints.length} constraints, ${indexes.length} indexes, ${triggers.length} application trigger.`,
  );
} catch (error) {
  const sqlState = error && typeof error === "object" && "code" in error
    ? String(error.code).replace(/[^A-Z0-9]/gi, "").slice(0, 12)
    : "unknown";
  const safeReason = error instanceof Error && error.message.startsWith("CATALOG_ASSERTION_FAILED:")
    ? error.message
    : `DATABASE_MIGRATION_FAILED:${phase}:SQLSTATE_${sqlState}`;
  console.error(`Migration verification failed: ${safeReason}`);
  process.exit(1);
}
