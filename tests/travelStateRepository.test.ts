import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({ query: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/server/db", () => ({ getDatabaseSql: () => database }));

import { upsertTravelState } from "@/lib/server/travelStateRepository";

const row = {
  namespace: "shopping",
  item_id: "custom-noodle",
  checked: false,
  custom_name: "泡麵",
  custom_category: "泡麵",
  custom_note: null,
  custom_source_url: null,
  updated_at: "2026-07-22T00:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  database.query.mockResolvedValue([row]);
});

describe("travel state recommendation persistence", () => {
  it("preserves old recommendation fields when a legacy operation omits them", async () => {
    await upsertTravelState({ namespace: "shopping", itemId: "custom-noodle", checked: true, name: "泡麵", category: "泡麵" });
    const [, values] = database.query.mock.calls[0];
    expect(values.slice(-2)).toEqual([false, false]);
  });

  it("allows a future edit to explicitly clear recommendation fields", async () => {
    await upsertTravelState({
      namespace: "shopping", itemId: "custom-noodle", checked: true,
      name: "泡麵", category: "泡麵", note: null, sourceUrl: null,
    });
    const [sql, values] = database.query.mock.calls[0];
    expect(sql).toContain("case when $9::boolean");
    expect(values.slice(-2)).toEqual([true, true]);
  });
});
