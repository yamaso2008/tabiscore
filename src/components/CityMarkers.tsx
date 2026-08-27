"use client";

import { memo, useMemo } from "react";
import { MAJOR_CITIES } from "@/constants/major-cities";
import type { Locale } from "@/i18n/messages";
import type { GeoProjection } from "d3-geo";

interface CityMarkersProps {
  projection: GeoProjection;
  locale: Locale;
}

/**
 * ピン位置は地図と一緒に拡縮し、内側の g は CSS 変数 --map-label-scale
 * で逆スケールする。パン中は変数を触らないので合成レイヤーが無効化されない。
 */
export const CityMarkers = memo(function CityMarkers({
  projection,
  locale,
}: CityMarkersProps) {
  const points = useMemo(
    () =>
      MAJOR_CITIES.flatMap((city) => {
        const point = projection([city.lon, city.lat]);
        if (!point) {
          return [];
        }

        return [
          {
            city,
            x: point[0],
            y: point[1],
          },
        ];
      }),
    [projection],
  );

  return (
    <g pointerEvents="none" aria-hidden="true">
      {points.map(({ city, x, y }) => {
        const label = locale === "en" ? city.nameEn : city.nameJa;
        const anchor = city.anchor ?? "start";

        return (
          <g
            key={city.id}
            data-city-marker=""
            transform={`translate(${x} ${y})`}
          >
            <g data-overlay-scale="" transform="scale(1)">
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
          </g>
        );
      })}
    </g>
  );
});
