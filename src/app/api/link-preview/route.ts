import { z } from "zod";
import { apiError, apiSuccess, requireTravelSession } from "@/lib/server/api";
import { fetchShoppingLinkPreview, ShoppingLinkPreviewError } from "@/lib/server/shoppingLinkPreview";

export const runtime = "nodejs";

const inputSchema = z.object({
  url: z.string().trim().min(1).max(2048),
});

export async function POST(request: Request) {
  const unauthorized = await requireTravelSession();
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => null) as unknown;
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) return apiError("VALIDATION_ERROR", "請貼上完整的推薦網址。", 400);

  try {
    return apiSuccess(await fetchShoppingLinkPreview(parsed.data.url));
  } catch (error) {
    if (error instanceof ShoppingLinkPreviewError) {
      const status = error.code === "FETCH_FAILED" ? 422 : 400;
      return apiError(error.code, error.message, status);
    }
    return apiError("PREVIEW_UNAVAILABLE", "目前無法讀取這個網頁，請手動輸入商品名稱。", 503);
  }
}
