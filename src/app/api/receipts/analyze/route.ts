import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { getAnalysisWarnings, receiptAnalysisSchema } from "@/lib/expenses";
import { apiError, apiSuccess, requireTravelSession } from "@/lib/server/api";

const GEMINI_MODEL = "gemini-3.5-flash";
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_REQUEST_BYTES = 5.6 * 1024 * 1024;
const supportedMimeTypes = ["image/jpeg", "image/png", "image/webp"] as const;

const requestSchema = z.object({
  imageBase64: z.string().min(16).max(Math.ceil(MAX_IMAGE_BYTES * 4 / 3) + 16),
  mimeType: z.enum(supportedMimeTypes),
});

let geminiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_NOT_CONFIGURED");
  if (!geminiClient) geminiClient = new GoogleGenAI({ apiKey, httpOptions: { timeout: 25_000 } });
  return geminiClient;
}

function hasExpectedSignature(buffer: Buffer, mimeType: (typeof supportedMimeTypes)[number]) {
  if (mimeType === "image/jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimeType === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
}

const prompt = `你是日本收據辨識助手。請只根據圖片可見內容輸出 schema 指定的 JSON，不可虛構。
amountJPY 必須是整張收據實際付款總額，優先找「合計、合計金額、お支払金額、ご利用金額、領収金額、クレジット利用額、現計」。
絕對不可把「小計、お預り、預り金、お釣り、釣銭、税額、點數餘額」當成總額。即使同時有 8% 與 10% 稅率也只取最終實付總額。
category 只能是：餐飲、交通、購物、伴手禮、門票、住宿、藥妝、其他。paymentMethod 只能是：現金、信用卡、交通卡、其他。
看不到或不確定的店名、日期、金額要回傳 null，降低 confidence 並寫入繁體中文 warnings。不得推測台幣金額。
若日期只有月日，可依本次旅行年份 2026 補全，但 warnings 必須註明。日期格式為 YYYY-MM-DD。
若日期不在 2026-08-02 至 2026-08-06，保留辨識日期並在 warnings 警告。
note 只寫有助人工確認的短句，不要逐品項抄錄，也不要輸出卡號或其他敏感資訊。`;

export async function POST(request: Request) {
  const unauthorized = await requireTravelSession();
  if (unauthorized) return unauthorized;

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_REQUEST_BYTES) return apiError("IMAGE_TOO_LARGE", "圖片太大，請重新選取或拍攝。", 413);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_REQUEST", "無法讀取圖片資料。", 400);
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return apiError("UNSUPPORTED_IMAGE", "僅支援 JPEG、PNG、WebP，壓縮後需小於 4MB。", 415);

  let image: Buffer;
  try {
    image = Buffer.from(parsed.data.imageBase64, "base64");
  } catch {
    return apiError("INVALID_IMAGE", "圖片資料損毀，請重新選取。", 400);
  }
  if (!image.length || image.length > MAX_IMAGE_BYTES || !hasExpectedSignature(image, parsed.data.mimeType)) {
    return apiError("INVALID_IMAGE", "圖片格式或內容不正確，請重新選取。", 400);
  }

  try {
    const interaction = await getGeminiClient().interactions.create({
      model: GEMINI_MODEL,
      input: [
        { type: "text", text: prompt },
        { type: "image", data: image.toString("base64"), mime_type: parsed.data.mimeType },
      ],
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: z.toJSONSchema(receiptAnalysisSchema),
      },
    }, { timeout: 25_000, maxRetries: 1 });
    if (!interaction.output_text) throw new Error("EMPTY_GEMINI_RESPONSE");
    const analysis = receiptAnalysisSchema.parse(JSON.parse(interaction.output_text));
    const warnings = getAnalysisWarnings(analysis);
    if (analysis.amountJPY === null) warnings.push("AI 找不到明確的實付總額，請手動輸入。");
    return apiSuccess({ ...analysis, warnings: [...new Set(warnings)] });
  } catch (error) {
    if (error instanceof Error && error.message === "GEMINI_NOT_CONFIGURED") {
      return apiError("GEMINI_NOT_CONFIGURED", "AI 收據辨識尚未完成設定，可先使用手動新增。", 503);
    }
    if (error instanceof Error && /timeout|timed out|deadline/i.test(error.message)) {
      return apiError("GEMINI_TIMEOUT", "AI 辨識逾時，請檢查網路後重新掃描。", 504);
    }
    return apiError("ANALYSIS_FAILED", "AI 無法可靠辨識這張收據，請重新拍攝或改用手動新增。", 502);
  }
}
