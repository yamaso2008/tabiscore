import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-jp",
});

const SITE_TITLE_JA = "Tabi Score | 世界旅行スコアマップ";
const SITE_TITLE_EN = "Earth Score | World Travel Score Map";
const SITE_DESCRIPTION_JA =
  "国・州・都道府県・省・地域をクリックして旅のスコアを記録";
const SITE_DESCRIPTION_EN =
  "Click a country, state, prefecture, or region to record your travel score";

export const metadata: Metadata = {
  title: SITE_TITLE_JA,
  description: SITE_DESCRIPTION_JA,
  applicationName: "Tabi Score",
  openGraph: {
    type: "website",
    siteName: "Tabi Score",
    title: SITE_TITLE_JA,
    description: SITE_DESCRIPTION_JA,
    locale: "ja_JP",
    alternateLocale: ["en_US"],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE_JA,
    description: SITE_DESCRIPTION_JA,
  },
  verification: {
    google: "6WGskn5ZKWmr7XlFAMp-lil9acygKMHtDfnFFY4poMI",
  },
  other: {
    "og:title:ja": SITE_TITLE_JA,
    "og:title:en": SITE_TITLE_EN,
    "og:description:en": SITE_DESCRIPTION_EN,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${notoSansJp.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
