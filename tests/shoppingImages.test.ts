import { describe, expect, it } from "vitest";
import { shoppingImageAssets, shoppingCategoryPlaceholderPaths, shoppingPendingImagePath } from "@/data/shoppingImages";
import { resolveShoppingItemImage } from "@/lib/shoppingImages";
import type { ChecklistItemData } from "@/types/trip";

function item(overrides: Partial<ChecklistItemData> = {}): ChecklistItemData {
  return { id: "example", name: "測試商品", category: "伴手禮", ...overrides };
}

describe("shopping image resolution", () => {
  it("resolves an official image by explicit image id", () => {
    const image = resolveShoppingItemImage(
      item({ imageId: "meigetsudo-torimon" }),
      shoppingImageAssets,
    );

    expect(image.kind).toBe("official");
    expect(image.src).toBe("/images/shopping/products/meigetsudo-torimon.webp");
    expect(image.sourceHref).toBe("https://www.meigetsudo.co.jp/i/1712");
  });

  it("resolves a custom item by a normalized product alias", () => {
    const image = resolveShoppingItemImage(
      item({ id: "custom-1", name: "想買：伊都きんぐ／博多ぱいおう" }),
      shoppingImageAssets,
      { isCustom: true },
    );

    expect(image.kind).toBe("official");
    expect(image.src).toContain("ito-king-hakata-paiou.webp");
  });

  it("uses a category placeholder for an undecided built-in item", () => {
    const image = resolveShoppingItemImage(
      item({ id: "generic", name: "眼藥水候補", category: "藥妝" }),
      shoppingImageAssets,
    );

    expect(image.kind).toBe("category");
    expect(image.statusLabel).toBe("款式現場決定");
    expect(image.src).toBe(shoppingCategoryPlaceholderPaths.藥妝);
  });

  it("marks an unmatched custom item as waiting for an official image", () => {
    const image = resolveShoppingItemImage(
      item({ id: "custom-2", name: "旅行用護唇膏", category: "生活用品" }),
      shoppingImageAssets,
      { isCustom: true },
    );

    expect(image.kind).toBe("pending");
    expect(image.statusLabel).toBe("待補官方圖");
    expect(image.src).toBe(shoppingPendingImagePath);
    expect(image.sourceHref).toBeUndefined();
  });
});
