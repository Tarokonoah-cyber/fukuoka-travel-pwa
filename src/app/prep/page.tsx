import { Checklist } from "@/components/Checklist";
import { NoticeBox } from "@/components/NoticeBox";
import { PageHeader } from "@/components/PageHeader";
import { PrepPageClient } from "@/components/PrepPageClient";
import { prepItems } from "@/data/prep";
import { packingCategories, packingItems } from "@/data/packing";

export default function PrepPage() {
  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="BEFORE DEPARTURE"
        title="行前檢查"
        description="航班、球賽、交通確認與行李清單都集中在這一頁。"
      />
      <NoticeBox tone="plain" title="只記提醒，不放敏感資料">
        完整護照號碼、私人文件、票券 QR code 與信用卡資訊請存在手機安全位置，不要放在公開網站。
      </NoticeBox>
      <PrepPageClient items={prepItems} />
      <section aria-labelledby="packing-title">
        <div className="section-header"><h2 id="packing-title">行李清單</h2><span>{packingItems.length} items</span></div>
        <NoticeBox title="出門前再確認">護照、每日用藥、手機與飲水，出門前再檢查一次。</NoticeBox>
        <Checklist items={packingItems} categories={packingCategories} namespace="packing" customPlaceholder="例如：媽媽的薄外套" />
      </section>
    </div>
  );
}
