import { describe, expect, it } from "vitest";
import { DEFAULT_TEXT_SIZE, parseTextSize } from "@/lib/textSize";

describe("閱讀字級設定", () => {
  it("沒有設定時預設大字", () => {
    expect(parseTextSize(null)).toBe("large");
    expect(DEFAULT_TEXT_SIZE).toBe("large");
  });

  it("還原合法的標準與大字設定", () => {
    expect(parseTextSize("standard")).toBe("standard");
    expect(parseTextSize("large")).toBe("large");
  });

  it("無效設定回退大字", () => {
    expect(parseTextSize("small")).toBe("large");
    expect(parseTextSize("")).toBe("large");
  });
});
