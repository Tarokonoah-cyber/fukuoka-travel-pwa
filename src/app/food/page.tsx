import type { Metadata } from "next";
import { FoodPageClient } from "@/components/FoodPageClient";

export const metadata: Metadata = {
  title: "美食候選清單",
  description: "福岡兩人旅行的必吃、順路與備選美食清單。",
};

export default function FoodPage() {
  return <FoodPageClient />;
}
