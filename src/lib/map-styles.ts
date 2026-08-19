import { getScoreColor, type Score } from "@/constants/scores";

export const MAP_WIDTH = 980;
export const MAP_HEIGHT = 520;

export const COUNTRY_STROKE = "#1e293b";
export const COUNTRY_STROKE_WIDTH = 1;
export const REGION_STROKE = "#64748b";
export const REGION_STROKE_WIDTH = 0.45;
export const REGION_STROKE_DASH: string | undefined = undefined;

export function getFillColor(score: Score, isHovered: boolean): string {
  if (score === 0) {
    return isHovered ? "#e2e8f0" : getScoreColor(0);
  }

  return getScoreColor(score);
}

export function getPopupPosition(
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  if (typeof window === "undefined") {
    return { x: clientX, y: clientY };
  }

  const popupWidth = 256;
  const popupHeight = 240;
  const margin = 12;

  return {
    x: Math.min(
      Math.max(clientX, popupWidth / 2 + margin),
      window.innerWidth - popupWidth / 2 - margin,
    ),
    y: Math.min(
      Math.max(clientY, popupHeight + margin),
      window.innerHeight - margin,
    ),
  };
}
