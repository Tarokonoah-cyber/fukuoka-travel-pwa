import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const interactionsCreate = vi.hoisted(() => vi.fn());
const serverApi = vi.hoisted(() => ({ requireTravelSession: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    interactions = { create: interactionsCreate };
  },
}));
vi.mock("@/lib/server/api", () => ({
  requireTravelSession: serverApi.requireTravelSession,
  apiSuccess: <T>(data: T, status = 200) => Response.json({ ok: true, data }, { status }),
  apiError: (code: string, message: string, status: number, details?: unknown) => Response.json({ ok: false, error: { code, message, ...(details === undefined ? {} : { details }) } }, { status }),
}));

import { POST } from "@/app/api/receipts/analyze/route";

const jpegBase64 = Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x01]).toString("base64").padEnd(16, "A");

function analyzeRequest(body: unknown, headers?: HeadersInit) {
  return new Request("http://localhost/api/receipts/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  serverApi.requireTravelSession.mockResolvedValue(null);
  vi.stubEnv("GEMINI_API_KEY", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("AI 收據辨識 Route Handler", () => {
  it("未登入時不呼叫 Gemini", async () => {
    serverApi.requireTravelSession.mockResolvedValueOnce(Response.json({ ok: false, error: { code: "UNAUTHORIZED" } }, { status: 401 }));
    const response = await POST(analyzeRequest({ imageBase64: jpegBase64, mimeType: "image/jpeg" }));
    expect(response.status).toBe(401);
    expect(interactionsCreate).not.toHaveBeenCalled();
  });

  it("拒絕過大 request 與不支援格式", async () => {
    const tooLarge = await POST(analyzeRequest({ imageBase64: jpegBase64, mimeType: "image/jpeg" }, { "Content-Length": String(6 * 1024 * 1024) }));
    expect(tooLarge.status).toBe(413);

    const unsupported = await POST(analyzeRequest({ imageBase64: jpegBase64, mimeType: "image/gif" }));
    expect(unsupported.status).toBe(415);
    expect(interactionsCreate).not.toHaveBeenCalled();
  });

  it("缺少 GEMINI_API_KEY 時安全回覆且可改用手動新增", async () => {
    const response = await POST(analyzeRequest({ imageBase64: jpegBase64, mimeType: "image/jpeg" }));
    const body = await response.json() as { error: { code: string; message: string } };
    expect(response.status).toBe(503);
    expect(body.error.code).toBe("GEMINI_NOT_CONFIGURED");
    expect(body.error.message).toContain("手動新增");
  });

  it("以 structured output 安全處理 null 欄位並補上總額警告", async () => {
    vi.stubEnv("GEMINI_API_KEY", "server-secret-key");
    interactionsCreate.mockResolvedValue({
      output_text: JSON.stringify({
        storeName: null,
        storeNameJa: null,
        expenseDate: null,
        amountJPY: null,
        category: "其他",
        paymentMethod: "其他",
        note: null,
        confidence: 0.4,
        warnings: ["照片偏模糊"],
      }),
    });
    const response = await POST(analyzeRequest({ imageBase64: jpegBase64, mimeType: "image/jpeg" }));
    const body = await response.json() as { data: { amountJPY: number | null; warnings: string[] } };
    expect(response.status).toBe(200);
    expect(body.data.amountJPY).toBeNull();
    expect(body.data.warnings.join(" ")).toContain("信心偏低");
    expect(body.data.warnings.join(" ")).toContain("找不到明確的實付總額");
    expect(interactionsCreate).toHaveBeenCalledWith(expect.objectContaining({
      model: "gemini-3.5-flash",
      response_format: expect.objectContaining({ mime_type: "application/json", schema: expect.any(Object) }),
    }), expect.any(Object));
  });

  it("Gemini 錯誤不暴露 API key 或原始錯誤", async () => {
    const secret = "server-secret-key";
    vi.stubEnv("GEMINI_API_KEY", secret);
    interactionsCreate.mockRejectedValue(new Error(`provider failure ${secret}`));
    const response = await POST(analyzeRequest({ imageBase64: jpegBase64, mimeType: "image/jpeg" }));
    const body = await response.text();
    expect(response.status).toBe(502);
    expect(body).not.toContain(secret);
    expect(body).not.toContain("provider failure");
  });
});
