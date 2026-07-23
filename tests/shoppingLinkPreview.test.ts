import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { normalizeRecommendationUrl } from "@/lib/recommendationUrl";
import {
  extractShoppingPageTitle,
  isPrivateNetworkAddress,
  parsePublicHttpUrl,
} from "@/lib/server/shoppingLinkPreview";

describe("shopping recommendation URL", () => {
  it("normalizes a public HTTP(S) URL and removes its fragment", () => {
    expect(normalizeRecommendationUrl(" https://example.com/item?q=1#reviews "))
      .toBe("https://example.com/item?q=1");
  });

  it.each([
    "ftp://example.com/item",
    "https://user:pass@example.com/item",
    "https://example.com:8443/item",
    "http://localhost/item",
    "http://localhost./item",
    "http://127.0.0.1/item",
    "http://[::1]/item",
  ])("rejects unsafe syntax: %s", (value) => {
    expect(normalizeRecommendationUrl(value)).toBeNull();
    expect(() => parsePublicHttpUrl(value)).toThrow();
  });

  it.each(["127.0.0.1", "10.0.0.1", "169.254.169.254", "192.168.1.1", "::1", "fd00::1"])
  ("recognizes private address %s", (address) => {
    expect(isPrivateNetworkAddress(address)).toBe(true);
  });

  it("prefers Open Graph title, decodes entities and limits unsafe numeric entities", () => {
    const html = `<html><head><title>Fallback</title><meta content="泡麵 &amp; 海帶 &#x1f35c; &#99999999;" property="og:title"></head></html>`;
    expect(extractShoppingPageTitle(html)).toBe("泡麵 & 海帶 🍜 &#99999999;");
  });

  it("falls back to the document title", () => {
    expect(extractShoppingPageTitle("<title> 網友推薦｜日本泡麵 </title>"))
      .toBe("網友推薦｜日本泡麵");
  });
});
