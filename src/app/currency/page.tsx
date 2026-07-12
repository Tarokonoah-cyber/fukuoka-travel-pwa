import { CurrencyConverter } from "@/components/CurrencyConverter";
import { PageHeader } from "@/components/PageHeader";

export default function CurrencyPage() {
  return <div className="currency-page page-enter"><PageHeader eyebrow="JPY / TWD" title="日幣換算" description="旅行中快速查看參考匯率"/><CurrencyConverter /></div>;
}
