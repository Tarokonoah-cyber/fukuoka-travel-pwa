import { Checklist } from "@/components/Checklist";
import { PageHeader } from "@/components/PageHeader";
import { shoppingCategories, shoppingItems } from "@/data/shopping";
import { shoppingImageAssets } from "@/data/shoppingImages";

export default function ShoppingPage() {
  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="SHOPPING NOTE"
        title="必買清單"
        description="價格是日幣估值；勾選會同步到兩支手機，圖片可點開確認包裝。"
      />
      <Checklist
        items={shoppingItems}
        categories={shoppingCategories}
        namespace="shopping"
        customPlaceholder="新增想買的東西"
        shoppingImageAssets={shoppingImageAssets}
      />
    </div>
  );
}
