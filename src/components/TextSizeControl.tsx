"use client";

import { useTextSize } from "@/components/TextSizeProvider";

export function TextSizeControl() {
  const { textSize, setTextSize } = useTextSize();

  return (
    <section className="reading-display" aria-labelledby="reading-display-title">
      <div className="section-header">
        <h2 id="reading-display-title">閱讀顯示</h2>
        <span>只儲存在這支手機</span>
      </div>
      <div className="text-size-card">
        <p>可隨時切換；大字模式是首次開啟的預設值。</p>
        <div className="text-size-options" aria-label="文字大小">
          <button type="button" aria-pressed={textSize === "standard"} onClick={() => setTextSize("standard")}>
            <span>標準</span><small>16 px</small>
          </button>
          <button type="button" aria-pressed={textSize === "large"} onClick={() => setTextSize("large")}>
            <span>大字</span><small>18 px</small>
          </button>
        </div>
      </div>
    </section>
  );
}
