import { CurrencyConverter } from "@/components/CurrencyConverter";
import { PageHeader } from "@/components/PageHeader";

export default function CurrencyPage() {
  return <div className="currency-page page-enter"><PageHeader eyebrow="JPY / TWD" title="匯率換算計算機"/><CurrencyConverter /></div>;
}
