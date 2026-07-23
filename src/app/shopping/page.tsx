import { Checklist } from "@/components/Checklist";
import { PageHeader } from "@/components/PageHeader";
import { ShoppingRecommendationForm } from "@/components/ShoppingRecommendationForm";
import { shoppingCategories, shoppingItems } from "@/data/shopping";
import { shoppingImageAssets } from "@/data/shoppingImages";

export default function ShoppingPage() {
  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="SHOPPING NOTE"
        title="必買清單"
        description="價格是日幣估值；勾選與推薦來源會同步到兩支手機，圖片可點開確認包裝。"
      />
      <ShoppingRecommendationForm categories={shoppingCategories} />
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
