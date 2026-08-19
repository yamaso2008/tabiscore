import type { CountryScores } from "@/constants/scores";
import type { RegionScores } from "@/lib/scores";
import {
  getCountryContribution,
  getEffectiveCountryScore,
} from "@/lib/scores";

export interface PopupPosition {
  x: number;
  y: number;
}

export interface SelectedArea {
  id: string;
  name: string;
  position: PopupPosition;
  kind: "country" | "region";
  countryCode?: string;
  countryName?: string;
  nameJa?: string;
  nameEn?: string;
  countryNameJa?: string;
  countryNameEn?: string;
  regionLabel?: string;
}

export interface MapStats {
  totalScore: number;
  visitedCount: number;
  visitedRegionCount: number;
}

export function calculateStats(
  countryScores: CountryScores,
  regionScores: RegionScores,
): MapStats {
  const countryIds = new Set([
    ...Object.keys(countryScores),
    ...Object.keys(regionScores),
  ]);

  let totalScore = 0;
  let visitedCount = 0;
  let visitedRegionCount = 0;

  for (const countryId of countryIds) {
    totalScore += getCountryContribution(
      countryId,
      countryScores,
      regionScores,
    );

    if (
      getEffectiveCountryScore(countryId, countryScores, regionScores) > 0
    ) {
      visitedCount += 1;
    }

    visitedRegionCount += Object.values(regionScores[countryId] ?? {}).filter(
      (score) => score > 0,
    ).length;
  }

  return { totalScore, visitedCount, visitedRegionCount };
}

export function getCountryStats(
  countryId: string,
  countryScores: CountryScores,
  regionScores: RegionScores,
) {
  return {
    displayScore: getEffectiveCountryScore(
      countryId,
      countryScores,
      regionScores,
    ),
    contribution: getCountryContribution(
      countryId,
      countryScores,
      regionScores,
    ),
    regionCount: Object.keys(regionScores[countryId] ?? {}).filter(
      (regionId) => (regionScores[countryId]?.[regionId] ?? 0) > 0,
    ).length,
  };
}
