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
}

export interface MapStats {
  totalScore: number;
  visitedCount: number;
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
  }

  return { totalScore, visitedCount };
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
