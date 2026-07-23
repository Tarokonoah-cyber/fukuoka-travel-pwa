import {
  shoppingCategoryPlaceholderPaths,
  shoppingDefaultPlaceholderPath,
  shoppingPendingImagePath,
} from "@/data/shoppingImages";
import type { ChecklistItemData } from "@/types/trip";
import type { ChecklistItemImage, ShoppingImageAsset } from "@/types/shopping";

export function normalizeShoppingItemName(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("ja")
    .replace(/[\s\u3000/／・,，、()（）\[\]【】「」『』'"_-]+/g, "");
}

function findShoppingImageAsset(item: ChecklistItemData, assets: readonly ShoppingImageAsset[]) {
  if (item.imageId) {
    const byImageId = assets.find((asset) => asset.id === item.imageId);
    if (byImageId) return byImageId;
  }

  const byItemId = assets.find((asset) => asset.itemIds.includes(item.id));
  if (byItemId) return byItemId;

  const normalizedName = normalizeShoppingItemName(item.name);
  return assets.find((asset) => asset.aliases.some((alias) => {
    const normalizedAlias = normalizeShoppingItemName(alias);
    return normalizedAlias.length >= 3 && (
      normalizedName === normalizedAlias || normalizedName.includes(normalizedAlias)
    );
  }));
}

export function resolveShoppingItemImage(
  item: ChecklistItemData,
  assets: readonly ShoppingImageAsset[],
  options: { isCustom?: boolean } = {},
): ChecklistItemImage {
  const categorySrc = shoppingCategoryPlaceholderPaths[item.category] ?? shoppingDefaultPlaceholderPath;
  const fallbackAlt = `${item.category}分類占位圖`;
  const asset = findShoppingImageAsset(item, assets);

  if (asset) {
    return {
      src: asset.src,
      alt: asset.alt,
      kind: "official",
      statusLabel: "官方商品圖",
      sourceHref: asset.sourceHref,
      sourceName: asset.sourceName,
      fallbackSrc: categorySrc,
      fallbackAlt,
    };
  }

  if (options.isCustom) {
    return {
      src: shoppingPendingImagePath,
      alt: `${item.name}待補官方商品圖`,
      kind: "pending",
      statusLabel: "待確認官方圖",
      fallbackSrc: categorySrc,
      fallbackAlt,
    };
  }

  return {
    src: categorySrc,
    alt: `${item.name}款式現場決定`,
    kind: "category",
    statusLabel: "款式現場決定",
    fallbackSrc: shoppingDefaultPlaceholderPath,
    fallbackAlt: "購物分類占位圖",
  };
}
