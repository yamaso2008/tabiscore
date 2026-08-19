"use client";

import { memo } from "react";
import { MAJOR_CITIES } from "@/constants/major-cities";
import type { Locale } from "@/i18n/messages";
import type { GeoProjection } from "d3-geo";

interface CityMarkersProps {
  projection: GeoProjection;
  zoom: number;
  locale: Locale;
}

export const CityMarkers = memo(function CityMarkers({
  projection,
  zoom,
  locale,
}: CityMarkersProps) {
  const inverseScale = 1 / Math.max(zoom, 0.001);

  return (
    <g pointerEvents="none" aria-hidden="true">
      {MAJOR_CITIES.map((city) => {
        const point = projection([city.lon, city.lat]);
        if (!point) {
          return null;
        }

        const [x, y] = point;
        const label = locale === "en" ? city.nameEn : city.nameJa;
        const anchor = city.anchor ?? "start";

        return (
          <g
            key={city.id}
            data-city-marker=""
            data-x={x}
            data-y={y}
            transform={`translate(${x} ${y}) scale(${inverseScale})`}
          >
            <circle
              r={2.8}
              fill="#0f172a"
              stroke="#ffffff"
              strokeWidth={1.15}
            />
            <text
              x={city.labelX ?? 6}
              y={city.labelY ?? 3}
              textAnchor={anchor}
              fontSize={10}
              fontWeight={500}
              fill="#0f172a"
              stroke="#ffffff"
              strokeWidth={2.15}
              paintOrder="stroke fill"
              strokeLinejoin="round"
              style={{
                fontFamily: "ui-sans-serif, system-ui, sans-serif",
              }}
            >
              {label}
            </text>
          </g>
        );
      })}
    </g>
  );
});
