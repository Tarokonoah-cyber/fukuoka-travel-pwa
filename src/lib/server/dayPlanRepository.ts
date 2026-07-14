import "server-only";
import { getDatabaseSql } from "@/lib/server/db";
import type { DayPlanCustomFields, DayPlanItemState, DayPlanStatus } from "@/types/dayPlan";

type DayPlanRow = {
  travel_date: string | Date;
  item_id: string;
  status: DayPlanStatus;
  sort_order: number;
  is_custom: boolean;
  custom_title: string | null;
  custom_time_label: string | null;
  custom_start_time: string | null;
  custom_location: string | null;
  custom_note: string | null;
  updated_at: string | Date;
};

function isoDate(value: string | Date) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
}

function isoDateTime(value: string | Date) {
  return value instanceof Date ? value.toISOString() : value;
}

function mapRow(row: DayPlanRow): DayPlanItemState {
  return {
    date: isoDate(row.travel_date),
    itemId: row.item_id,
    status: row.status,
    sortOrder: row.sort_order,
    isCustom: row.is_custom,
    custom: row.is_custom ? {
      title: row.custom_title ?? "",
      timeLabel: row.custom_time_label ?? "彈性",
      startTime: row.custom_start_time,
      location: row.custom_location ?? "",
      note: row.custom_note ?? "",
    } : null,
    updatedAt: isoDateTime(row.updated_at),
  };
}

const returningColumns = `
  travel_date, item_id, status, sort_order, is_custom,
  custom_title, custom_time_label, custom_start_time,
  custom_location, custom_note, updated_at
`;

export async function listDayPlanState(date: string) {
  const sql = getDatabaseSql();
  const rows = await sql.query(`
    select ${returningColumns}
    from travel_day_plan_state
    where travel_date = $1::date and deleted_at is null
    order by sort_order, item_id
  `, [date]);
  return (rows as DayPlanRow[]).map(mapRow);
}

export async function createCustomDayPlanItem(input: {
  date: string;
  itemId: string;
  sortOrder: number;
  custom: DayPlanCustomFields;
}) {
  const sql = getDatabaseSql();
  const rows = await sql.query(`
    insert into travel_day_plan_state (
      travel_date, item_id, status, sort_order, is_custom,
      custom_title, custom_time_label, custom_start_time, custom_location, custom_note
    ) values ($1::date, $2, 'pending', $3, true, $4, $5, $6, $7, $8)
    on conflict (travel_date, item_id) do nothing
    returning ${returningColumns}
  `, [input.date, input.itemId, input.sortOrder, input.custom.title, input.custom.timeLabel, input.custom.startTime, input.custom.location, input.custom.note]);
  return rows.length ? mapRow((rows as DayPlanRow[])[0]) : null;
}

export async function patchDayPlanItem(input: {
  date: string;
  itemId: string;
  status: DayPlanStatus;
  sortOrder: number;
  isCustom: boolean;
  custom: DayPlanCustomFields | null;
  baseUpdatedAt: string | null;
}) {
  const sql = getDatabaseSql();
  const rows = await sql.query(`
    with upserted as (
      insert into travel_day_plan_state (
        travel_date, item_id, status, sort_order, is_custom,
        custom_title, custom_time_label, custom_start_time, custom_location, custom_note
      ) values ($1::date, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      on conflict (travel_date, item_id) do update set
        status = excluded.status,
        sort_order = excluded.sort_order,
        custom_title = coalesce(excluded.custom_title, travel_day_plan_state.custom_title),
        custom_time_label = coalesce(excluded.custom_time_label, travel_day_plan_state.custom_time_label),
        custom_start_time = coalesce(excluded.custom_start_time, travel_day_plan_state.custom_start_time),
        custom_location = coalesce(excluded.custom_location, travel_day_plan_state.custom_location),
        custom_note = coalesce(excluded.custom_note, travel_day_plan_state.custom_note),
        updated_at = now()
      where travel_day_plan_state.deleted_at is null
        and ($11::timestamptz is null or travel_day_plan_state.updated_at = $11::timestamptz)
      returning ${returningColumns}
    ), deactivate as (
      update travel_day_plan_state
      set status = 'pending', updated_at = now()
      where travel_date = $1::date and $3 = 'active' and item_id <> $2
        and status = 'active' and deleted_at is null and exists (select 1 from upserted)
    )
    select * from upserted
  `, [
    input.date, input.itemId, input.status, input.sortOrder, input.isCustom,
    input.custom?.title ?? null, input.custom?.timeLabel ?? null, input.custom?.startTime ?? null,
    input.custom?.location ?? null, input.custom?.note ?? null, input.baseUpdatedAt,
  ]);
  if (rows.length) return { item: mapRow((rows as DayPlanRow[])[0]), conflict: false };
  const current = await sql.query(`
    select ${returningColumns}
    from travel_day_plan_state
    where travel_date = $1::date and item_id = $2 and deleted_at is null
  `, [input.date, input.itemId]);
  return { item: current.length ? mapRow((current as DayPlanRow[])[0]) : null, conflict: true };
}

export async function reorderDayPlan(date: string, orderedItemIds: string[]) {
  const sql = getDatabaseSql();
  const rows = await sql.query(`
    with ordering as (
      select value::text as item_id, ordinality::integer * 100 as sort_order
      from jsonb_array_elements_text($2::jsonb) with ordinality
    ), upserted as (
      insert into travel_day_plan_state (travel_date, item_id, status, sort_order, is_custom)
      select $1::date, ordering.item_id, 'pending', ordering.sort_order, false
      from ordering
      on conflict (travel_date, item_id) do update set
        sort_order = excluded.sort_order,
        updated_at = now()
      where travel_day_plan_state.deleted_at is null
      returning ${returningColumns}
    )
    select * from upserted order by sort_order, item_id
  `, [date, JSON.stringify(orderedItemIds)]);
  return (rows as DayPlanRow[]).map(mapRow);
}

export async function deleteCustomDayPlanItem(date: string, itemId: string) {
  const sql = getDatabaseSql();
  const rows = await sql.query(`
    update travel_day_plan_state
    set deleted_at = now(), updated_at = now()
    where travel_date = $1::date and item_id = $2 and is_custom = true and deleted_at is null
    returning item_id
  `, [date, itemId]);
  return rows.length > 0;
}

export async function resetDayPlan(date: string) {
  const sql = getDatabaseSql();
  const rows = await sql.query(`delete from travel_day_plan_state where travel_date = $1::date returning item_id`, [date]);
  return rows.length;
}
