import type { ShoppingImageAsset } from "@/types/shopping";

const shoppingProductRoot = "/images/shopping/products";
const shoppingPlaceholderRoot = "/images/shopping/placeholders";

export const shoppingImageAssets: readonly ShoppingImageAsset[] = [
  {
    id: "kasanoya-umegae",
    src: `${shoppingProductRoot}/kasanoya-umegae.webp`,
    alt: "かさの家梅枝餅禮盒與獨立包裝",
    sourceHref: "https://kasanoya.raku-uru.jp/item-detail/1877537",
    sourceName: "かさの家官方商店",
    itemIds: ["kasanoya-umegae"],
    aliases: ["かさの家梅枝餅", "かさの家 梅ヶ枝餅", "梅枝餅", "梅ヶ枝餅"],
  },
  {
    id: "fukutaro-menbei",
    src: `${shoppingProductRoot}/fukutaro-menbei.webp`,
    alt: "福太郎めんべい原味盒裝與獨立包裝",
    sourceHref: "https://www.fukutaro-shop.com/Form/Product/ProductList.aspx?cat=200",
    sourceName: "FUKUTARO ONLINE STORE",
    itemIds: ["fukutaro-mentai-senbei"],
    aliases: ["福太郎めんべい", "福太郎明太子仙貝", "めんべいプレーン", "めんべい"],
  },
  {
    id: "meigetsudo-torimon",
    src: `${shoppingProductRoot}/meigetsudo-torimon.webp`,
    alt: "明月堂博多通りもん十二入盒裝",
    sourceHref: "https://www.meigetsudo.co.jp/i/1712",
    sourceName: "明月堂官方商品頁",
    itemIds: ["torimon"],
    aliases: ["明月堂博多通りもん", "博多通りもん", "博多通饅頭", "通りもん"],
  },
  {
    id: "amanberry",
    src: `${shoppingProductRoot}/amanberry.webp`,
    alt: "AMANBERRY 甘王草莓奶油夾心甜點官方商品照",
    sourceHref: "https://amanberry.jp/",
    sourceName: "AMANBERRY 官方網站",
    itemIds: ["amanberry"],
    aliases: ["AMANBERRY", "アマンベリー", "AMAN BERRY"],
  },
  {
    id: "yamaya-mentai-senbei",
    src: `${shoppingProductRoot}/yamaya-mentai-senbei.webp`,
    alt: "やまやめんたいせんべい六枚入包裝",
    sourceHref: "https://www.yamaya.com/products/detail/06618",
    sourceName: "やまや官方商品頁",
    itemIds: ["yamaya-mentai-senbei"],
    aliases: ["やまや明太子仙貝", "やまやめんたいせんべい", "めんたいせんべい"],
  },
  {
    id: "ito-king-hakata-paiou",
    src: `${shoppingProductRoot}/ito-king-hakata-paiou.webp`,
    alt: "伊都きんぐ博多ぱいおう綠色包裝與草莓派",
    sourceHref: "https://jalplaza-airport.jalux.com/product/detail/9200907241925/",
    sourceName: "JAL PLAZA 官方商品頁",
    itemIds: ["ito-king-hakata-paiou"],
    aliases: ["伊都きんぐ博多ぱいおう", "伊都きんぐ 博多ぱいおう", "博多ぱいおう", "博多派王"],
  },
  {
    id: "lion-kyusoku-jikan",
    src: `${shoppingProductRoot}/lion-kyusoku-jikan.webp`,
    alt: "LION 休足時間足部舒緩貼十八枚入包裝",
    sourceHref: "https://kyusokujikan.lion.co.jp/",
    sourceName: "LION 休足時間官方網站",
    itemIds: ["patch"],
    aliases: ["休足時間", "休足時間足すっきりシート", "LION休足時間"],
  },
] as const;

export const shoppingCategoryPlaceholderPaths: Readonly<Record<string, string>> = {
  伴手禮: `${shoppingPlaceholderRoot}/gift.svg`,
  藥妝: `${shoppingPlaceholderRoot}/drugstore.svg`,
  零食: `${shoppingPlaceholderRoot}/snack.svg`,
  生活用品: `${shoppingPlaceholderRoot}/daily.svg`,
  棒球周邊: `${shoppingPlaceholderRoot}/baseball.svg`,
  媽媽想買: `${shoppingPlaceholderRoot}/mom.svg`,
};

export const shoppingPendingImagePath = `${shoppingPlaceholderRoot}/pending.svg`;
export const shoppingDefaultPlaceholderPath = shoppingCategoryPlaceholderPaths.伴手禮;

export const shoppingImagePaths = [
  ...shoppingImageAssets.map((asset) => asset.src),
  ...new Set(Object.values(shoppingCategoryPlaceholderPaths)),
  shoppingPendingImagePath,
];
