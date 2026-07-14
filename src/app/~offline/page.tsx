import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { NoticeBox } from "@/components/NoticeBox";

export default function OfflineFallbackPage() {
  return <div className="page-enter">
    <PageHeader eyebrow="OFFLINE" title="目前沒有網路" description="已下載的旅程頁面與本機清單仍可使用。" />
    <NoticeBox tone="blue" title="先不用擔心">可以回到今日控制台、完整行程或緊急資訊；需要 AI 收據辨識與雲端旅費時，再恢復網路。</NoticeBox>
    <div className="offline-fallback-actions"><Link href="/today">回今日控制台</Link><Link href="/itinerary">查看完整行程</Link><Link href="/emergency">緊急資訊</Link></div>
  </div>;
}
