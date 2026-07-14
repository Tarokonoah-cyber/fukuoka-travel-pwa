import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));

import { cookies } from "next/headers";
import { GET, POST } from "@/app/api/travel-auth/route";
import { createTravelSession, isAuthConfigured, verifyPin, verifyTravelSessionToken } from "@/lib/server/auth";

const PIN = "739184";

beforeEach(() => {
  vi.stubEnv("TRAVEL_ADMIN_PIN", PIN);
  vi.mocked(cookies).mockResolvedValue({ get: vi.fn(() => undefined) } as never);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("旅費 PIN 與 session", () => {
  it("session 探測不需以私密 API 的 401 判斷", async () => {
    const locked = await GET();
    expect(locked.status).toBe(200);
    expect(await locked.json()).toMatchObject({ data: { authenticated: false } });

    const session = createTravelSession();
    vi.mocked(cookies).mockResolvedValue({ get: vi.fn(() => ({ value: session.token })) } as never);
    const unlocked = await GET();
    expect(await unlocked.json()).toMatchObject({ data: { authenticated: true } });
  });

  it("缺少正式 PIN 時安全鎖定", () => {
    vi.stubEnv("TRAVEL_ADMIN_PIN", "");
    expect(isAuthConfigured()).toBe(false);
    expect(verifyPin(PIN)).toBe(false);
  });

  it("只接受正確 PIN，session 可驗證且不可竄改", () => {
    expect(verifyPin(PIN)).toBe(true);
    expect(verifyPin("000000")).toBe(false);
    const session = createTravelSession();
    expect(session.token).not.toContain(PIN);
    expect(verifyTravelSessionToken(session.token)).toBe(true);
    expect(verifyTravelSessionToken(`${session.token.slice(0, -1)}x`)).toBe(false);
  });

  it("正式環境 cookie 使用 HttpOnly、Secure、SameSite=Lax", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const response = await POST(new Request("http://localhost/api/travel-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: PIN }),
    }));
    const cookie = response.headers.get("set-cookie") ?? "";
    expect(response.status).toBe(200);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).not.toContain(PIN);
  });

  it("錯誤 PIN 回應不暴露正確 PIN", async () => {
    const response = await POST(new Request("http://localhost/api/travel-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: "111111" }),
    }));
    const body = await response.text();
    expect(response.status).toBe(401);
    expect(body).not.toContain(PIN);
  });
});
