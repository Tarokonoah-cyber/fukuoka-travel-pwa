import Link from "next/link";
import { InfoCard } from "@/components/InfoCard";
import { NoticeBox } from "@/components/NoticeBox";
import { PageHeader } from "@/components/PageHeader";
import { documents } from "@/data/documents";

export default function DocumentsPage() {
  return (
    <div className="page-enter">
      <PageHeader eyebrow="SAFE SUMMARY" title="文件摘要" description="只放旅途中方便查看的非敏感資訊。" />
      <NoticeBox title="重要安全提醒">敏感文件請保存在手機安全位置，不要放在公開網站。</NoticeBox>
      <Link className="prep-entry-link" href="/prep">
        <span>PRE-TRIP CHECK</span>
        <strong>查看待補資料與行前檢查</strong>
        <p>航班、球賽票券、保險、緊急聯絡與訂房摘要。</p>
        <b>→</b>
      </Link>
      <InfoCard title="航班摘要">
        <div className="document-lines">
          <p>
            <span>去程</span>
            {documents.flight.outbound}
          </p>
          <p>
            <span>回程</span>
            {documents.flight.inbound}
          </p>
          <small>{documents.flight.note}</small>
        </div>
      </InfoCard>
      <InfoCard title="住宿摘要">
        <div className="document-lines">
          <p>
            <span>飯店</span>
            {documents.hotel.name}
          </p>
          <p>
            <span>地址</span>
            {documents.hotel.address}
          </p>
          <p>
            <span>入住</span>
            {documents.hotel.checkIn}
          </p>
          <p>
            <span>退房</span>
            {documents.hotel.checkOut}
          </p>
          <p>
            <span>訂房</span>
            {documents.hotel.bookingSummary}
          </p>
        </div>
      </InfoCard>
      <InfoCard title="棒球票券">
        <div className="document-lines">
          <p>
            <span>日期</span>
            {documents.baseball.date}
          </p>
          <p>
            <span>地點</span>
            {documents.baseball.place}
          </p>
          <p>
            <span>時間</span>
            {documents.baseball.startTime}
          </p>
          <p>
            <span>票券</span>
            {documents.baseball.ticket}
          </p>
        </div>
      </InfoCard>
      <InfoCard title="旅遊保險">
        <div className="document-lines">
          <p>
            <span>公司</span>
            {documents.insurance.company}
          </p>
          <p>
            <span>聯絡</span>
            {documents.insurance.contact}
          </p>
          <small>{documents.insurance.note}</small>
        </div>
      </InfoCard>
      <div className="reminder-list">
        {documents.reminders.map((reminder) => (
          <InfoCard title={reminder.title} key={reminder.title}>
            <p>{reminder.body}</p>
          </InfoCard>
        ))}
      </div>
    </div>
  );
}
