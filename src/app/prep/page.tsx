import { NoticeBox } from "@/components/NoticeBox";
import { PageHeader } from "@/components/PageHeader";
import { PrepPageClient } from "@/components/PrepPageClient";
import { prepItems } from "@/data/prep";

export default function PrepPage() {
  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="BEFORE DEPARTURE"
        title="行前檢查"
        description="把航班、球賽、熊本／太宰府交通與必買清單收斂成出發前可勾選的小清單。"
      />
      <NoticeBox tone="plain" title="只記提醒，不放敏感資料">
        完整護照號碼、私人文件、票券 QR code 與信用卡資訊請存在手機安全位置，不要放在公開網站。
      </NoticeBox>
      <PrepPageClient items={prepItems} />
    </div>
  );
}
