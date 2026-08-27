import type { Locale } from "@/i18n/messages";

/**
 * アプリのバージョン情報。更新時はここだけを書き換える
 * （package.json の version も合わせて更新しておくと運用しやすい）。
 */
export const APP_VERSION = "1.1.0";

/** 最終更新日（YYYY-MM-DD） */
export const APP_LAST_UPDATED = "2026-08-26";

export function formatLastUpdated(locale: Locale): string {
  const [year, month, day] = APP_LAST_UPDATED.split("-").map(Number);
  if (!year || !month || !day) {
    return APP_LAST_UPDATED;
  }

  if (locale === "ja") {
    return `${year}年${month}月${day}日`;
  }

  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
