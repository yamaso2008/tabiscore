export type Locale = "ja" | "en";

export const LOCALE_STORAGE_KEY = "world-keiken-chi-locale";

export const MESSAGES = {
  ja: {
    title: "Tabi Score",
    subtitle: "国・州・都道府県・省・地域をクリックして旅のスコアを記録",
    metaTitle: "Tabi Score | 世界旅行スコアマップ",
    metaDescription:
      "国・州・都道府県・省・地域をクリックして旅のスコアを記録する世界地図アプリ",
    totalScore: "合計スコア",
    visitedCountries: "訪問国数",
    visitedRegions: "州・県・地域",
    legend: "凡例",
    legendNote: "主要国は州・県・地域別に表示",
    selectScore: "スコアを選択",
    close: "閉じる",
    settings: "設定",
    language: "言語",
    japanese: "日本語",
    english: "English",
    resetScores: "すべてのスコアをリセット",
    resetConfirm: "すべての記録が消えます。よろしいですか？",
    resetDone: "スコアをリセットしました",
    showMajorCities: "主要都市を表示",
    share: "シェア",
    saveImage: "画像として保存",
    shareOnX: "X でシェア",
    exportFailed: "画像の書き出しに失敗しました",
    loadingWorld: "世界地図を読み込み中...",
    loadingRegions: "州・都道府県・省データを読み込み中...",
    loadFailed: "地図の表示に失敗しました",
    loadPartialFailed: "詳細地図の一部を読み込めませんでした",
    retry: "再試行",
    reload: "再読み込み",
    mapAria: "世界地図",
    zoomIn: "拡大",
    zoomOut: "縮小",
    resetView: "表示をリセット",
    scores: {
      0: "未踏",
      1: "通過",
      2: "接地",
      3: "訪問",
      4: "宿泊",
      5: "居住",
    },
    regionLabels: {
      USA: "州",
      JPN: "都道府県",
      CHN: "省",
      CAN: "州・準州",
      AUS: "州・準州",
      BRA: "州",
      RUS: "連邦構成主体",
      IND: "州・連邦直轄領",
      GBR: "構成国",
      FRA: "地域圏",
      DEU: "州",
      ITA: "州",
      ESP: "自治州",
      KOR: "道・広域市",
      TWN: "県・市",
      IDN: "州",
      MEX: "州",
      ARG: "州",
    },
    tweet: (stats: {
      totalScore: number;
      visitedCount: number;
      visitedRegionCount: number;
    }) =>
      `私のTabi Scoreは${stats.totalScore}点（訪問国数: ${stats.visitedCount}、州・地域: ${stats.visitedRegionCount}）でした！ #TabiScore #旅スコア`,
  },
  en: {
    title: "Earth Score",
    subtitle:
      "Click a country, state, prefecture, or region to record your travel score",
    metaTitle: "Earth Score | World Travel Score Map",
    metaDescription:
      "Click a country, state, prefecture, or region to record your travel score on a world map",
    totalScore: "Total score",
    visitedCountries: "Countries",
    visitedRegions: "Regions",
    legend: "Legend",
    legendNote: "Major countries are shown by state / region",
    selectScore: "Select a score",
    close: "Close",
    settings: "Settings",
    language: "Language",
    japanese: "日本語",
    english: "English",
    resetScores: "Reset all scores",
    resetConfirm: "This will erase all records. Continue?",
    resetDone: "All scores were reset",
    showMajorCities: "Show Major Cities",
    share: "Share",
    saveImage: "Save as image",
    shareOnX: "Share on X",
    exportFailed: "Failed to export image",
    loadingWorld: "Loading world map...",
    loadingRegions: "Loading state and region data...",
    loadFailed: "Failed to display the map",
    loadPartialFailed: "Some detailed map data failed to load",
    retry: "Retry",
    reload: "Reload",
    mapAria: "World map",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    resetView: "Reset view",
    scores: {
      0: "Unvisited",
      1: "Passed through",
      2: "Landed",
      3: "Visited",
      4: "Stayed overnight",
      5: "Lived",
    },
    regionLabels: {
      USA: "States",
      JPN: "Prefectures",
      CHN: "Provinces",
      CAN: "Provinces / territories",
      AUS: "States / territories",
      BRA: "States",
      RUS: "Federal subjects",
      IND: "States / territories",
      GBR: "Countries",
      FRA: "Regions",
      DEU: "States",
      ITA: "Regions",
      ESP: "Autonomous communities",
      KOR: "Provinces / cities",
      TWN: "Counties / cities",
      IDN: "Provinces",
      MEX: "States",
      ARG: "Provinces",
    },
    tweet: (stats: {
      totalScore: number;
      visitedCount: number;
      visitedRegionCount: number;
    }) =>
      `My Earth Score is ${stats.totalScore} (Visited: ${stats.visitedCount} countries, ${stats.visitedRegionCount} states/regions)! #EarthScore #TravelScore`,
  },
} as const;

export type Messages = (typeof MESSAGES)[Locale];

export function getMessages(locale: string | null | undefined): Messages {
  return locale === "en" ? MESSAGES.en : MESSAGES.ja;
}

export function getScoreText(
  messages: Messages,
  score: number,
): string {
  const key = score as keyof Messages["scores"];
  return messages.scores[key] ?? messages.scores[0] ?? String(score);
}

export function getRegionTypeLabel(
  messages: Messages,
  countryCode: string | null | undefined,
): string {
  if (!countryCode) {
    return "";
  }

  const labels = messages.regionLabels as Record<string, string>;
  return labels[countryCode] ?? "";
}
