import type { Score, CountryScores } from "@/constants/scores";
import {
  REGION_STORAGE_KEY,
  STORAGE_KEY,
} from "@/constants/scores";

export type RegionScores = Record<string, Record<string, Score>>;

export interface ScoreData {
  countryScores: CountryScores;
  regionScores: RegionScores;
}

export function loadScoreData(): ScoreData {
  if (typeof window === "undefined") {
    return { countryScores: {}, regionScores: {} };
  }

  try {
    const countryRaw = window.localStorage.getItem(STORAGE_KEY);
    const regionRaw = window.localStorage.getItem(REGION_STORAGE_KEY);

    return {
      countryScores: countryRaw
        ? (JSON.parse(countryRaw) as CountryScores)
        : {},
      regionScores: regionRaw
        ? (JSON.parse(regionRaw) as RegionScores)
        : {},
    };
  } catch {
    return { countryScores: {}, regionScores: {} };
  }
}

export function saveScoreData(data: ScoreData): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data.countryScores));
  window.localStorage.setItem(
    REGION_STORAGE_KEY,
    JSON.stringify(data.regionScores),
  );
}

export function hasRegionScores(
  countryId: string,
  regionScores: RegionScores,
): boolean {
  const regions = regionScores[countryId];
  return Boolean(regions && Object.keys(regions).length > 0);
}

export function getMaxRegionScore(
  countryId: string,
  regionScores: RegionScores,
): Score {
  const regions = regionScores[countryId];
  if (!regions || Object.keys(regions).length === 0) {
    return 0;
  }

  return Math.max(0, ...Object.values(regions)) as Score;
}

export function getRegionScoreSum(
  countryId: string,
  regionScores: RegionScores,
): number {
  const regions = regionScores[countryId];
  if (!regions) {
    return 0;
  }

  return Object.values(regions).reduce<number>(
    (sum, score) => sum + score,
    0,
  );
}

/** 世界地図の国の色に使うスコア（州/県の最高値を優先） */
export function getEffectiveCountryScore(
  countryId: string,
  countryScores: CountryScores,
  regionScores: RegionScores,
): Score {
  if (hasRegionScores(countryId, regionScores)) {
    return getMaxRegionScore(countryId, regionScores);
  }

  return countryScores[countryId] ?? 0;
}

/** 合計スコアへの加算値（州/県がある場合は合計、なければ国スコア） */
export function getCountryContribution(
  countryId: string,
  countryScores: CountryScores,
  regionScores: RegionScores,
): number {
  if (hasRegionScores(countryId, regionScores)) {
    return getRegionScoreSum(countryId, regionScores);
  }

  return countryScores[countryId] ?? 0;
}

export function buildEffectiveCountryScores(
  countryScores: CountryScores,
  regionScores: RegionScores,
): CountryScores {
  const countryIds = new Set([
    ...Object.keys(countryScores),
    ...Object.keys(regionScores),
  ]);

  const effective: CountryScores = {};

  for (const countryId of countryIds) {
    const score = getEffectiveCountryScore(
      countryId,
      countryScores,
      regionScores,
    );
    if (score > 0) {
      effective[countryId] = score;
    }
  }

  return effective;
}
