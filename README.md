# Fukuoka Travel PWA

2026/8/2–8/6 福岡五天四夜手機旅行手冊，為兩人同行與媽媽友善需求設計。

## 本機啟動

```bash
npm install
npm run dev
```

## 品質檢查

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## AI 收據旅費

旅費模組位於 `/expenses`，使用下列 server-only 環境變數：

- `DATABASE_URL`：Neon PostgreSQL 連線字串
- `GEMINI_API_KEY`：Gemini 收據辨識
- `TRAVEL_ADMIN_PIN`：正式環境的旅行共用 PIN

三者都不得使用 `NEXT_PUBLIC_` 前綴或提交到 Git。完成資料庫設定後執行：

```bash
npm run db:migrate
```

指令會載入專案根目錄的 `.env.local`、重複安全地執行 migration，並驗證旅費、共用清單與旅途控制台三組資料表及 index。收據照片只在瀏覽器與辨識請求的記憶體中短暫存在，不會寫入資料庫、IndexedDB 或物件儲存。

## 旅途控制台與共用同步

- `/today` 預設聚焦 Now／Next 與固定時間提醒；完整共享行程展開後仍可完成、跳過、復原、排序與加入臨時行程。
- 首頁依出發前、旅途中與旅程後自動切換摘要；旅行期間會直接顯示精簡控制台。
- 地圖預設依階段切換目的地／今日／全部範圍；行李、購物與願望清單預設只看未完成項目。
- 行李、購物、願望、行前檢查及每日實際進度使用同一組旅行 PIN 與 HttpOnly Cookie。
- Neon 採逐項儲存；IndexedDB 保存裝置快照與離線 outbox。同步 runner 會持續送到 outbox 確認為空。
- 同項目版本衝突以伺服器最新版本為準；不同項目可以合併。

## PWA 離線邊界

- Serwist 在 production build 產生 revisioned precache，公開行程頁與必要的 Next.js chunks 可離線使用。
- `/expenses`、所有同源 `/api/*`、旅費回應與收據影像不進入 Cache Storage。
- 地圖離線保證點位清單可讀；OpenStreetMap 底圖只保留曾經瀏覽的區域。
- 天氣與匯率是裝置層快取，不跨手機同步。

## 資料與狀態

- 行程、清單、交通與文件摘要位於 `src/data/`，旅程日期與住宿基本資料統一由 `src/data/trip.ts` 提供。
- 共用型別位於 `src/types/trip.ts`。
- 舊 localStorage 清單會在首次啟動時遷移到 IndexedDB，再於解鎖後送往 Neon。
- 程式內原始行程保持靜態；旅途中完成狀態、排序與臨時項目存放於共用 day-plan。

可直接作為 Next.js 專案部署到 Vercel。
