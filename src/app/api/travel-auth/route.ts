import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/server/api";
import { createTravelSession, hasTravelSession, isAuthConfigured, TRAVEL_SESSION_COOKIE, verifyPin } from "@/lib/server/auth";

const pinSchema = z.object({ pin: z.string().min(1).max(128) });

export async function GET() {
  return apiSuccess({ authenticated: isAuthConfigured() && await hasTravelSession() });
}

export async function POST(request: Request) {
  if (!isAuthConfigured()) return apiError("AUTH_NOT_CONFIGURED", "旅費管理尚未設定 PIN，請聯絡網站管理者。", 503);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_REQUEST", "請輸入有效的 PIN。", 400);
  }
  const parsed = pinSchema.safeParse(body);
  if (!parsed.success || !verifyPin(parsed.data.pin)) return apiError("INVALID_PIN", "PIN 不正確，請再試一次。", 401);

  const session = createTravelSession();
  const response = apiSuccess({ authenticated: true });
  response.headers.append("Set-Cookie", `${TRAVEL_SESSION_COOKIE}=${session.token}; Path=/; Max-Age=${session.maxAge}; HttpOnly; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
  return response;
}

export async function DELETE() {
  const response = apiSuccess({ authenticated: false });
  response.headers.append("Set-Cookie", `${TRAVEL_SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
  return response;
}
