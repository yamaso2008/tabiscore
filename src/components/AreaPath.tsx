"use client";

import { memo, useState } from "react";
import type { Score } from "@/constants/scores";
import {
  COUNTRY_STROKE,
  COUNTRY_STROKE_WIDTH,
  REGION_STROKE,
  REGION_STROKE_DASH,
  REGION_STROKE_WIDTH,
  getFillColor,
} from "@/lib/map-styles";

interface AreaPathProps {
  areaId: string;
  countryCode?: string;
  d: string;
  score: Score;
  label: string;
  kind?: "country" | "region";
  onSelect: (
    event: React.MouseEvent<SVGPathElement>,
    areaId: string,
    countryCode?: string,
  ) => void;
}

export const AreaPath = memo(function AreaPath({
  areaId,
  countryCode,
  d,
  score,
  label,
  kind = "country",
  onSelect,
}: AreaPathProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isRegion = kind === "region";
  const strokeWidth = isRegion ? REGION_STROKE_WIDTH : COUNTRY_STROKE_WIDTH;
  const stroke = isHovered
    ? "#0f172a"
    : isRegion
      ? REGION_STROKE
      : COUNTRY_STROKE;

  return (
    <path
      d={d}
      className="cursor-pointer focus:outline-none"
      data-stroke={isRegion ? "region" : "country"}
      fill={getFillColor(score, isHovered)}
      fillOpacity={isHovered ? 0.85 : 1}
      stroke={stroke}
      strokeWidth={isHovered ? strokeWidth + (isRegion ? 0.2 : 0.25) : strokeWidth}
      strokeDasharray={isRegion && !isHovered ? REGION_STROKE_DASH : undefined}
      vectorEffect="non-scaling-stroke"
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(event, areaId, countryCode);
      }}
    >
      <title>{label}</title>
    </path>
  );
});
