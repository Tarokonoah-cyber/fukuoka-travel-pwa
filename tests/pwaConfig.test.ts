import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";
import nextConfig from "../next.config";
import { publicOfflineRoutes } from "@/data/pwa";

describe("PWA reliability configuration", () => {
  it("exposes the three primary travel shortcuts", () => {
    expect(manifest().shortcuts?.map((shortcut) => shortcut.url)).toEqual([
      "/today",
      "/itinerary",
      "/expenses",
    ]);
  });

  it("redirects the retired budget page to the private expense ledger", async () => {
    const redirects = await nextConfig.redirects?.();
    expect(redirects).toContainEqual({
      source: "/budget",
      destination: "/expenses",
      permanent: true,
    });
  });

  it("never sends private expenses or same-origin APIs through Cache Storage", () => {
    const worker = readFileSync(new URL("../src/app/sw.ts", import.meta.url), "utf8");

    expect(worker).toContain('url.pathname.startsWith("/expenses")');
    expect(worker).toContain('url.pathname.startsWith("/api/")');
    expect(worker).toContain("new NetworkOnly()");
    expect(worker.indexOf("privateRoutes")).toBeLessThan(worker.indexOf("...defaultCache"));
    expect(publicOfflineRoutes).not.toContain("/expenses");
    expect(publicOfflineRoutes).not.toContain("/budget");
    expect(publicOfflineRoutes).not.toContain("/emergency");
    expect(publicOfflineRoutes).not.toContain("/packing");
    expect(publicOfflineRoutes).toContain("/prep");
    expect(publicOfflineRoutes).toContain("/~offline");
  });
});
