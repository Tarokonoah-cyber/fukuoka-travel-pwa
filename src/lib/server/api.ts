import "server-only";
import { hasTravelSession } from "@/lib/server/auth";

export function apiSuccess<T>(data: T, status = 200) {
  return Response.json({ ok: true, data }, { status, headers: { "Cache-Control": "no-store" } });
}

export function apiError(code: string, message: string, status: number, details?: unknown) {
  return Response.json({ ok: false, error: { code, message, ...(details === undefined ? {} : { details }) } }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function requireTravelSession() {
  return await hasTravelSession() ? null : apiError("UNAUTHORIZED", "請先輸入旅費管理 PIN。", 401);
}
