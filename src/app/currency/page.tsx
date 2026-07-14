import { CurrencyConverter } from "@/components/CurrencyConverter";
import { PageHeader } from "@/components/PageHeader";

export default function CurrencyPage() {
  return <div className="currency-page page-enter"><PageHeader eyebrow="JPY / TWD" title="匯率換算計算機" description="輸入或直接按數字鍵，即時計算日幣與台幣。"/><CurrencyConverter /></div>;
}
