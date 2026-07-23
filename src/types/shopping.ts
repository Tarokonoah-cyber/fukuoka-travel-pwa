export type ChecklistItemImageKind = "official" | "category" | "pending";

export interface ChecklistItemImage {
  src: string;
  alt: string;
  kind: ChecklistItemImageKind;
  statusLabel: string;
  sourceHref?: string;
  sourceName?: string;
  fallbackSrc: string;
  fallbackAlt: string;
}

export interface ShoppingImageAsset {
  id: string;
  src: string;
  alt: string;
  sourceHref: string;
  sourceName: string;
  itemIds: readonly string[];
  aliases: readonly string[];
}

export interface ShoppingLinkPreview {
  url: string;
  title: string;
  sourceName: string;
}
