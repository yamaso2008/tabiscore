import type { Metadata } from "next";
import { WorldMap } from "@/components/WorldMap";

export const metadata: Metadata = {
  title: "Tabi Score | 世界旅行スコアマップ",
  description: "国・州・都道府県・省・地域をクリックして旅のスコアを記録",
  openGraph: {
    title: "Tabi Score | 世界旅行スコアマップ",
    description: "国・州・都道府県・省・地域をクリックして旅のスコアを記録",
    locale: "ja_JP",
    alternateLocale: ["en_US"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tabi Score | 世界旅行スコアマップ",
    description: "国・州・都道府県・省・地域をクリックして旅のスコアを記録",
  },
  alternates: {
    languages: {
      ja: "/",
      en: "/",
    },
  },
};

export default function Home() {
  return <WorldMap />;
}
