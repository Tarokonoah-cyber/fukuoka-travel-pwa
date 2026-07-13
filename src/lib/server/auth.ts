import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const TRAVEL_SESSION_COOKIE = "fukuoka_travel_session";
const SESSION_SECONDS = 60 * 60 * 24 * 14;

function getConfiguredPin() {
  const pin = process.env.TRAVEL_ADMIN_PIN?.trim();
  if (pin) return pin;
  return process.env.NODE_ENV === "development" ? "2468" : null;
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(`fukuoka-expenses:${payload}`).digest("base64url");
}

export function isAuthConfigured() {
  return getConfiguredPin() !== null;
}

export function verifyPin(candidate: string) {
  const pin = getConfiguredPin();
  return pin ? safeEqual(candidate, pin) : false;
}

export function createTravelSession() {
  const pin = getConfiguredPin();
  if (!pin) throw new Error("AUTH_NOT_CONFIGURED");
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = `v1.${expiresAt}`;
  return { token: `${payload}.${signature(payload, pin)}`, maxAge: SESSION_SECONDS };
}

export function verifyTravelSessionToken(token: string | undefined) {
  const pin = getConfiguredPin();
  if (!pin || !token) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return false;
  const expiresAt = Number(parts[1]);
  if (!Number.isInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) return false;
  const payload = `${parts[0]}.${parts[1]}`;
  return safeEqual(parts[2], signature(payload, pin));
}

export async function hasTravelSession() {
  return verifyTravelSessionToken((await cookies()).get(TRAVEL_SESSION_COOKIE)?.value);
}
