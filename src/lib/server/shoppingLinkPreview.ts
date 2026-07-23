import "server-only";
import { lookup } from "node:dns/promises";
import { request as httpRequest, type IncomingMessage } from "node:http";
import { request as httpsRequest } from "node:https";
import { isIP } from "node:net";
import { normalizeRecommendationUrl } from "@/lib/recommendationUrl";
import type { ShoppingLinkPreview } from "@/types/shopping";

const MAX_HTML_BYTES = 512_000;
const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT_MS = 8_000;

export type ShoppingLinkPreviewErrorCode =
  | "INVALID_URL"
  | "BLOCKED_URL"
  | "FETCH_FAILED"
  | "UNSUPPORTED_CONTENT"
  | "CONTENT_TOO_LARGE";

export class ShoppingLinkPreviewError extends Error {
  constructor(public code: ShoppingLinkPreviewErrorCode, message: string) {
    super(message);
  }
}

export function parsePublicHttpUrl(value: string) {
  const normalized = normalizeRecommendationUrl(value);
  if (!normalized) {
    throw new ShoppingLinkPreviewError("INVALID_URL", "請貼上完整的 http:// 或 https:// 網址。");
  }
  return new URL(normalized);
}

function isPrivateIpv4(address: string) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [first, second] = parts;
  return first === 0
    || first === 10
    || first === 127
    || (first === 100 && second >= 64 && second <= 127)
    || (first === 169 && second === 254)
    || (first === 172 && second >= 16 && second <= 31)
    || (first === 192 && (second === 0 || second === 168))
    || (first === 198 && (second === 18 || second === 19 || second === 51))
    || (first === 203 && second === 0)
    || first >= 224;
}

export function isPrivateNetworkAddress(address: string) {
  const version = isIP(address);
  if (version === 4) return isPrivateIpv4(address);
  if (version !== 6) return true;
  const normalized = address.toLowerCase();
  return normalized === "::"
    || normalized === "::1"
    || normalized.startsWith("::ffff:")
    || normalized.startsWith("fc")
    || normalized.startsWith("fd")
    || /^fe[89ab]/.test(normalized)
    || normalized.startsWith("ff")
    || normalized.startsWith("2001:db8:");
}

function abortable<T>(promise: Promise<T>, signal: AbortSignal) {
  if (signal.aborted) return Promise.reject(new Error("REQUEST_ABORTED"));
  return new Promise<T>((resolve, reject) => {
    const handleAbort = () => reject(new Error("REQUEST_ABORTED"));
    signal.addEventListener("abort", handleAbort, { once: true });
    promise.then(
      (value) => { signal.removeEventListener("abort", handleAbort); resolve(value); },
      (error) => { signal.removeEventListener("abort", handleAbort); reject(error); },
    );
  });
}

async function resolvePublicDestination(url: URL, signal: AbortSignal) {
  const hostname = url.hostname.toLowerCase();
  if (
    !hostname
    || isIP(hostname)
    || hostname === "localhost"
    || hostname.endsWith(".localhost")
    || hostname.endsWith(".local")
    || hostname.endsWith(".internal")
    || hostname.endsWith(".lan")
    || hostname === "metadata.google.internal"
  ) {
    throw new ShoppingLinkPreviewError("BLOCKED_URL", "這個網址不是公開網頁。");
  }

  let addresses: Array<{ address: string; family: number }>;
  try {
    addresses = await abortable(lookup(hostname, { all: true, verbatim: true, family: 4 }), signal);
  } catch {
    throw new ShoppingLinkPreviewError("FETCH_FAILED", "找不到這個網址的伺服器。");
  }
  if (!addresses.length || addresses.some(({ address }) => isPrivateNetworkAddress(address))) {
    throw new ShoppingLinkPreviewError("BLOCKED_URL", "這個網址指向非公開網路，無法讀取。");
  }
  return addresses[0];
}

async function openPinnedResponse(url: URL, signal: AbortSignal) {
  const destination = await resolvePublicDestination(url, signal);
  return await new Promise<IncomingMessage>((resolve, reject) => {
    const options = {
      hostname: destination.address,
      family: destination.family,
      method: "GET",
      path: `${url.pathname}${url.search}`,
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "Accept-Encoding": "identity",
        Host: url.hostname,
        "User-Agent": "FukuokaTravelPWA-LinkPreview/1.0",
      },
      signal,
    };
    const handleResponse = (response: IncomingMessage) => {
      const remoteAddress = response.socket.remoteAddress ?? "";
      if (isPrivateNetworkAddress(remoteAddress)) {
        response.destroy();
        reject(new ShoppingLinkPreviewError("BLOCKED_URL", "這個網址連線到非公開網路，無法讀取。"));
        return;
      }
      resolve(response);
    };
    const request = url.protocol === "https:"
      ? httpsRequest({ ...options, servername: url.hostname, rejectUnauthorized: true }, handleResponse)
      : httpRequest(options, handleResponse);
    request.once("error", reject);
    request.end();
  });
}

async function readLimitedHtml(response: IncomingMessage) {
  const declaredLength = Number(response.headers["content-length"] ?? 0);
  if (declaredLength > MAX_HTML_BYTES) {
    response.destroy();
    throw new ShoppingLinkPreviewError("CONTENT_TOO_LARGE", "網頁內容太大，請手動輸入商品名稱。");
  }

  const chunks: Uint8Array[] = [];
  let received = 0;
  for await (const value of response) {
    const chunk = typeof value === "string" ? Buffer.from(value) : value as Buffer;
    received += chunk.byteLength;
    if (received > MAX_HTML_BYTES) {
      response.destroy();
      throw new ShoppingLinkPreviewError("CONTENT_TOO_LARGE", "網頁內容太大，請手動輸入商品名稱。");
    }
    chunks.push(chunk);
  }
  const charset = response.headers["content-type"]?.match(/charset\s*=\s*["']?([^;\s"']+)/i)?.[1] ?? "utf-8";
  let decoder: TextDecoder;
  try { decoder = new TextDecoder(charset); } catch { decoder = new TextDecoder(); }
  return decoder.decode(Buffer.concat(chunks));
}

function decodeHtmlEntities(value: string) {
  const named: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };
  const decodeCodePoint = (entity: string, codePoint: number) => {
    if (!Number.isInteger(codePoint) || codePoint < 0 || codePoint > 0x10ffff) return entity;
    return String.fromCodePoint(codePoint);
  };
  return value
    .replace(/&#(\d+);/g, (entity, code: string) => decodeCodePoint(entity, Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (entity, code: string) => decodeCodePoint(entity, Number.parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (entity, name: string) => named[name.toLowerCase()] ?? entity);
}

function cleanTitle(value: string) {
  return decodeHtmlEntities(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

function getTagAttributes(tag: string) {
  const attributes: Record<string, string> = {};
  const pattern = /([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
  for (const match of tag.matchAll(pattern)) {
    attributes[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? "";
  }
  return attributes;
}

export function extractShoppingPageTitle(html: string) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const attributes = getTagAttributes(tag);
    const key = (attributes.property ?? attributes.name ?? "").toLowerCase();
    if ((key === "og:title" || key === "twitter:title") && attributes.content) {
      const title = cleanTitle(attributes.content);
      if (title) return title;
    }
  }
  const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return titleMatch ? cleanTitle(titleMatch[1]) : "";
}

export async function fetchShoppingLinkPreview(value: string): Promise<ShoppingLinkPreview> {
  let url = parsePublicHttpUrl(value);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
      let response: IncomingMessage;
      try {
        response = await openPinnedResponse(url, controller.signal);
      } catch (error) {
        if (error instanceof ShoppingLinkPreviewError) throw error;
        throw new ShoppingLinkPreviewError("FETCH_FAILED", "目前無法讀取這個網頁，請手動輸入商品名稱。");
      }

      const status = response.statusCode ?? 0;
      if ([301, 302, 303, 307, 308].includes(status)) {
        const location = response.headers.location;
        response.destroy();
        if (!location || redirectCount === MAX_REDIRECTS) {
          throw new ShoppingLinkPreviewError("FETCH_FAILED", "網址重新導向次數過多。");
        }
        url = parsePublicHttpUrl(new URL(location, url).toString());
        continue;
      }
      if (status < 200 || status >= 300) {
        response.destroy();
        throw new ShoppingLinkPreviewError("FETCH_FAILED", "這個網頁暫時無法讀取，請手動輸入商品名稱。");
      }
      const contentType = response.headers["content-type"]?.toLowerCase() ?? "";
      if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
        response.destroy();
        throw new ShoppingLinkPreviewError("UNSUPPORTED_CONTENT", "請貼商品頁或文章頁，不要直接貼圖片或檔案網址。");
      }

      let html: string;
      try {
        html = await readLimitedHtml(response);
      } catch (error) {
        if (error instanceof ShoppingLinkPreviewError) throw error;
        throw new ShoppingLinkPreviewError("FETCH_FAILED", "目前無法讀取這個網頁，請手動輸入商品名稱。");
      }
      const title = extractShoppingPageTitle(html);
      return {
        url: url.toString(),
        title: title || url.hostname.replace(/^www\./, ""),
        sourceName: url.hostname.replace(/^www\./, ""),
      };
    }
    throw new ShoppingLinkPreviewError("FETCH_FAILED", "目前無法讀取這個網頁。");
  } finally {
    clearTimeout(timeout);
  }
}
