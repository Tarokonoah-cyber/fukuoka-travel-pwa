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
- `TRAVEL_ADMIN_PIN`：正式環境的旅費管理 PIN

三者都不得使用 `NEXT_PUBLIC_` 前綴或提交到 Git。完成資料庫設定後執行：

```bash
npm run db:migrate
```

指令會載入專案根目錄的 `.env.local`、重複安全地執行 migration，並驗證 `travel_expenses` 資料表與 index。收據照片只在瀏覽器與辨識請求的記憶體中短暫存在，不會寫入資料庫或物件儲存。

## 資料與狀態

- 行程、清單、交通與文件摘要位於 `src/data/`。
- 共用型別位於 `src/types/trip.ts`。
- 行李、必買與願望清單的勾選和自訂項目只保存在瀏覽器 `localStorage`。
- 旅費以外的既有旅行資料仍維持原本的本機與靜態資料架構。

可直接作為 Next.js 專案部署到 Vercel。
