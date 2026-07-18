import "server-only";
import { getDatabaseSql } from "@/lib/server/db";
import type { FoodCandidate } from "@/types/food";

type FoodCandidateRow = {
  id: string;
  payload: FoodCandidate;
  updated_at: string | Date;
};

function mapCandidate(row: FoodCandidateRow): FoodCandidate {
  return {
    ...row.payload,
    id: row.id,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}

export async function listFoodCandidates() {
  const sql = getDatabaseSql();
  const rows = await sql`
    select id, payload, updated_at
    from travel_food_candidates
    order by updated_at desc, id
  `;
  return (rows as FoodCandidateRow[]).map(mapCandidate);
}

export async function upsertFoodCandidate(item: FoodCandidate, baseUpdatedAt: string | null) {
  const sql = getDatabaseSql();
  const rows = await sql.query(`
    insert into travel_food_candidates (id, payload)
    values ($1, $2::jsonb)
    on conflict (id) do update set
      payload = excluded.payload,
      updated_at = now()
    where $3::timestamptz is null or travel_food_candidates.updated_at = $3::timestamptz
    returning id, payload, updated_at
  `, [item.id, JSON.stringify(item), baseUpdatedAt]);
  if (rows.length) return { item: mapCandidate((rows as FoodCandidateRow[])[0]), conflict: false };
  const current = await sql.query(`
    select id, payload, updated_at
    from travel_food_candidates
    where id = $1
  `, [item.id]);
  return { item: current.length ? mapCandidate((current as FoodCandidateRow[])[0]) : null, conflict: true };
}
