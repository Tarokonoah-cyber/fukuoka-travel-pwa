import { beforeEach, describe, expect, it, vi } from "vitest";

const preview = vi.hoisted(() => {
  class PreviewError extends Error {
    constructor(public code: string, message: string) { super(message); }
  }
  return { fetch: vi.fn(), PreviewError };
});
const serverApi = vi.hoisted(() => ({ requireTravelSession: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/server/shoppingLinkPreview", () => ({
  fetchShoppingLinkPreview: preview.fetch,
  ShoppingLinkPreviewError: preview.PreviewError,
}));
vi.mock("@/lib/server/api", () => ({
  requireTravelSession: serverApi.requireTravelSession,
  apiSuccess: <T>(data: T, status = 200) => Response.json({ ok: true, data }, { status }),
  apiError: (code: string, message: string, status: number) => Response.json({ ok: false, error: { code, message } }, { status }),
}));

import { POST } from "@/app/api/link-preview/route";

beforeEach(() => {
  vi.clearAllMocks();
  serverApi.requireTravelSession.mockResolvedValue(null);
});

describe("shopping link preview route", () => {
  it("returns the verified page title for an authenticated traveler", async () => {
    const result = { url: "https://example.com/item", title: "網友推薦泡麵", sourceName: "example.com" };
    preview.fetch.mockResolvedValue(result);
    const response = await POST(new Request("http://localhost/api/link-preview", {
      method: "POST", body: JSON.stringify({ url: result.url }),
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ data: result });
  });

  it("rejects invalid input before fetching", async () => {
    const response = await POST(new Request("http://localhost/api/link-preview", { method: "POST", body: "{}" }));
    expect(response.status).toBe(400);
    expect(preview.fetch).not.toHaveBeenCalled();
  });

  it("maps safe preview errors and requires the travel session", async () => {
    preview.fetch.mockRejectedValueOnce(new preview.PreviewError("BLOCKED_URL", "這個網址不是公開網頁。"));
    const blocked = await POST(new Request("http://localhost/api/link-preview", { method: "POST", body: JSON.stringify({ url: "http://localhost" }) }));
    expect(blocked.status).toBe(400);

    serverApi.requireTravelSession.mockResolvedValueOnce(Response.json({ ok: false }, { status: 401 }));
    const unauthorized = await POST(new Request("http://localhost/api/link-preview", { method: "POST", body: JSON.stringify({ url: "https://example.com" }) }));
    expect(unauthorized.status).toBe(401);
  });
});
