export type TextSize = "standard" | "large";

export const TEXT_SIZE_STORAGE_KEY = "fukuoka-text-size-v1";
export const DEFAULT_TEXT_SIZE: TextSize = "large";

export function parseTextSize(value: string | null | undefined): TextSize {
  return value === "standard" || value === "large" ? value : DEFAULT_TEXT_SIZE;
}
