export const travelNamespaces = ["packing", "shopping", "wishlist", "prep"] as const;

export type TravelNamespace = (typeof travelNamespaces)[number];

export type TravelStateItem = {
  namespace: TravelNamespace;
  itemId: string;
  checked: boolean;
  name: string | null;
  category: string | null;
  isCustom: boolean;
  updatedAt: string;
};

export type TravelStateResponse = {
  items: TravelStateItem[];
  updatedAt: string | null;
};

export type TravelStatePatch = {
  namespace: TravelNamespace;
  itemId: string;
  checked: boolean;
  name?: string | null;
  category?: string | null;
  baseUpdatedAt?: string | null;
};

export type TravelStateDelete = {
  namespace: TravelNamespace;
  itemId?: string;
};
