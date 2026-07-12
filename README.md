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
npx tsc --noEmit
npm run build
```

## 資料與狀態

- 行程、清單、交通與文件摘要位於 `src/data/`。
- 共用型別位於 `src/types/trip.ts`。
- 行李、必買與願望清單的勾選和自訂項目只保存在瀏覽器 `localStorage`。
- 專案不需要登入、資料庫、環境變數或 API key。

可直接作為 Next.js 專案部署到 Vercel。
