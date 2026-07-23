import "server-only";
import { getDatabaseSql } from "@/lib/server/db";
import type { TravelNamespace, TravelStateItem, TravelStatePatch } from "@/types/travelSync";

type TravelStateRow = {
  namespace: TravelNamespace;
  item_id: string;
  checked: boolean;
  custom_name: string | null;
  custom_category: string | null;
  custom_note: string | null;
  custom_source_url: string | null;
  updated_at: string | Date;
};

function mapItem(row: TravelStateRow): TravelStateItem {
  return {
    namespace: row.namespace,
    itemId: row.item_id,
    checked: row.checked,
    name: row.custom_name,
    category: row.custom_category,
    note: row.custom_note,
    sourceUrl: row.custom_source_url,
    isCustom: Boolean(row.custom_name && row.custom_category),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}

export async function listTravelState() {
  const sql = getDatabaseSql();
  const rows = await sql`
    select namespace, item_id, checked, custom_name, custom_category, custom_note, custom_source_url, updated_at
    from travel_item_state
    order by namespace, item_id
  `;
  return (rows as TravelStateRow[]).map(mapItem);
}

export async function upsertTravelState(input: TravelStatePatch) {
  const sql = getDatabaseSql();
  const noteProvided = Object.prototype.hasOwnProperty.call(input, "note");
  const sourceUrlProvided = Object.prototype.hasOwnProperty.call(input, "sourceUrl");
  const rows = await sql.query(`
    insert into travel_item_state (
      namespace, item_id, checked, custom_name, custom_category, custom_note, custom_source_url
    ) values ($1, $2, $3, $4, $5, $6, $7)
    on conflict (namespace, item_id) do update set
      checked = excluded.checked,
      custom_name = coalesce(excluded.custom_name, travel_item_state.custom_name),
      custom_category = coalesce(excluded.custom_category, travel_item_state.custom_category),
      custom_note = case when $9::boolean then excluded.custom_note else travel_item_state.custom_note end,
      custom_source_url = case when $10::boolean then excluded.custom_source_url else travel_item_state.custom_source_url end,
      updated_at = now()
    where $8::timestamptz is null or travel_item_state.updated_at = $8::timestamptz
    returning namespace, item_id, checked, custom_name, custom_category, custom_note, custom_source_url, updated_at
  `, [
    input.namespace,
    input.itemId,
    input.checked,
    input.name ?? null,
    input.category ?? null,
    input.note ?? null,
    input.sourceUrl ?? null,
    input.baseUpdatedAt ?? null,
    noteProvided,
    sourceUrlProvided,
  ]);
  if (rows.length) return { item: mapItem((rows as TravelStateRow[])[0]), conflict: false };
  const current = await sql.query(`
    select namespace, item_id, checked, custom_name, custom_category, custom_note, custom_source_url, updated_at
    from travel_item_state where namespace = $1 and item_id = $2
  `, [input.namespace, input.itemId]);
  return { item: current.length ? mapItem((current as TravelStateRow[])[0]) : null, conflict: true };
}

export async function deleteTravelStateItem(namespace: TravelNamespace, itemId: string) {
  const sql = getDatabaseSql();
  const rows = await sql`
    delete from travel_item_state
    where namespace = ${namespace} and item_id = ${itemId}
    returning item_id
  `;
  return rows.length > 0;
}

export async function resetTravelState(namespace: TravelNamespace) {
  const sql = getDatabaseSql();
  const rows = await sql`
    delete from travel_item_state
    where namespace = ${namespace}
    returning item_id
  `;
  return rows.length;
}
