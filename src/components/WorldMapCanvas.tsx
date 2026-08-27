"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { AreaPath } from "@/components/AreaPath";
import { CityMarkers } from "@/components/CityMarkers";
import {
  DETAIL_COUNTRY_CODES,
  getCanonicalCountryId,
  getLocalizedCountryName,
  getLocalizedRegionName,
  getRegionId,
  isDetailCountry,
  type DetailCountryCode,
} from "@/constants/detail-countries";
import type { CountryScores, Score } from "@/constants/scores";
import { useMapGestures } from "@/hooks/useMapGestures";
import { normalizeProperties, type GeographyFeature } from "@/lib/geography";
import {
  COUNTRY_STROKE,
  COUNTRY_STROKE_WIDTH,
  MAP_HEIGHT,
  MAP_WIDTH,
} from "@/lib/map-styles";
import { createPathGenerator, createWorldProjection } from "@/lib/projection";
import type { RegionScores } from "@/lib/scores";
import type { Locale } from "@/i18n/messages";

export interface WorldMapCanvasHandle {
  getSvg: () => SVGSVGElement | null;
}

interface WorldMapCanvasProps {
  worldFeatures: GeographyFeature[];
  regionFeatures: Partial<Record<DetailCountryCode, GeographyFeature[]>>;
  countryScores: CountryScores;
  regionScores: RegionScores;
  onCountrySelect: (
    event: React.MouseEvent<SVGPathElement>,
    countryId: string,
    nameJa: string,
    nameEn: string,
  ) => void;
  onRegionSelect: (
    event: React.MouseEvent<SVGPathElement>,
    countryCode: DetailCountryCode,
    regionId: string,
    nameJa: string,
    nameEn: string,
  ) => void;
  locale: Locale;
  showMajorCities?: boolean;
  /** ダブルタップ・2本指タップでのズーム時に選択ポップアップを閉じる */
  onDismissSelection?: () => void;
}

interface DrawnArea {
  key: string;
  d: string;
  id: string;
  nameJa: string;
  nameEn: string;
}

const SKIP_REGION_NAMES: Partial<Record<DetailCountryCode, Set<string>>> = {
  CHN: new Set(["taiwan", "台湾", "台灣"]),
};

function shouldSkipRegion(
  countryCode: DetailCountryCode,
  properties: Record<string, unknown>,
): boolean {
  const skipNames = SKIP_REGION_NAMES[countryCode];
  if (!skipNames) {
    return false;
  }

  const normalized = normalizeProperties(properties);

  return [
    normalized.name,
    normalized.nam,
    normalized.nam_ja,
    normalized.name_simplified_chinese,
  ]
    .filter(Boolean)
    .some((value) => skipNames.has(value.replace(/\s/g, "").toLowerCase()));
}

function safePathD(
  pathGenerator: (feature: GeographyFeature) => string | null,
  featureItem: GeographyFeature | null | undefined,
): string | null {
  if (!featureItem?.geometry) {
    return null;
  }

  try {
    return pathGenerator(featureItem) || null;
  } catch {
    return null;
  }
}

export const WorldMapCanvas = forwardRef<WorldMapCanvasHandle, WorldMapCanvasProps>(
  function WorldMapCanvas(
    {
      worldFeatures,
      regionFeatures,
      countryScores,
      regionScores,
      onCountrySelect,
      onRegionSelect,
      locale,
      showMajorCities = true,
      onDismissSelection,
    },
    ref,
  ) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const planeRef = useRef<HTMLDivElement | null>(null);
  const worldLayerRef = useRef<SVGGElement | null>(null);
  const suppressClickRef = useRef(false);

  useImperativeHandle(ref, () => ({
    getSvg: () => svgRef.current,
  }));

  const handleSuppressClick = useCallback((suppress: boolean) => {
    suppressClickRef.current = suppress;
  }, []);

  const handleTapZoom = useCallback(() => {
    onDismissSelection?.();
  }, [onDismissSelection]);

  const { zoomIn, zoomOut, resetView, refreshOverlayScale } = useMapGestures({
    viewportRef,
    planeRef,
    worldLayerRef,
    onSuppressClickChange: handleSuppressClick,
    onTapZoom: handleTapZoom,
  });

  // 都市ピンが再マウントされたら現在のズームに合わせた逆スケールを再適用する
  useEffect(() => {
    refreshOverlayScale();
  }, [locale, refreshOverlayScale, showMajorCities]);

  const projection = useMemo(() => createWorldProjection(), []);
  const pathGenerator = useMemo(
    () => createPathGenerator(projection),
    [projection],
  );

  const loadedDetailCountries = useMemo(
    () => DETAIL_COUNTRY_CODES.filter((code) => regionFeatures[code]?.length),
    [regionFeatures],
  );

  const countryAreas = useMemo<DrawnArea[]>(() => {
    return (worldFeatures ?? []).flatMap((featureItem, index) => {
      if (!featureItem?.geometry) {
        return [];
      }

      const countryId = getCanonicalCountryId(featureItem.properties);

      if (
        isDetailCountry(countryId) &&
        loadedDetailCountries.includes(countryId)
      ) {
        return [];
      }

      const d = safePathD(pathGenerator, featureItem);
      if (!d) {
        return [];
      }

      return [
        {
          key: `country-${countryId}-${index}`,
          d,
          id: countryId,
          nameJa: getLocalizedCountryName(featureItem.properties, "ja"),
          nameEn: getLocalizedCountryName(featureItem.properties, "en"),
        },
      ];
    });
  }, [worldFeatures, loadedDetailCountries, pathGenerator]);

  const countryOutlines = useMemo<DrawnArea[]>(() => {
    return (worldFeatures ?? []).flatMap((featureItem, index) => {
      if (!featureItem?.geometry) {
        return [];
      }

      const countryId = getCanonicalCountryId(featureItem.properties);

      if (
        !isDetailCountry(countryId) ||
        !loadedDetailCountries.includes(countryId)
      ) {
        return [];
      }

      const d = safePathD(pathGenerator, featureItem);
      if (!d) {
        return [];
      }

      return [
        {
          key: `outline-${countryId}-${index}`,
          d,
          id: countryId,
          nameJa: "",
          nameEn: "",
        },
      ];
    });
  }, [worldFeatures, loadedDetailCountries, pathGenerator]);

  const regionAreas = useMemo(() => {
    return loadedDetailCountries.map((countryCode) => {
      const features = regionFeatures[countryCode] ?? [];

      const areas = features.flatMap((featureItem, index) => {
        if (!featureItem?.geometry) {
          return [];
        }

        if (shouldSkipRegion(countryCode, featureItem.properties ?? {})) {
          return [];
        }

        const d = safePathD(pathGenerator, featureItem);
        if (!d) {
          return [];
        }

        const regionId = getRegionId(countryCode, featureItem.properties);

        return [
          {
            key: `${countryCode}-${regionId}-${index}`,
            d,
            id: regionId,
            nameJa: getLocalizedRegionName(
              countryCode,
              featureItem.properties,
              "ja",
            ),
            nameEn: getLocalizedRegionName(
              countryCode,
              featureItem.properties,
              "en",
            ),
          },
        ];
      });

      return { countryCode, areas };
    });
  }, [loadedDetailCountries, regionFeatures, pathGenerator]);

  const handleCountryClick = useCallback(
    (event: React.MouseEvent<SVGPathElement>, countryId: string) => {
      if (suppressClickRef.current) {
        return;
      }

      const area = countryAreas.find((item) => item.id === countryId);
      onCountrySelect(
        event,
        countryId,
        area?.nameJa ?? countryId,
        area?.nameEn ?? countryId,
      );
    },
    [countryAreas, onCountrySelect],
  );

  const handleRegionClick = useCallback(
    (
      event: React.MouseEvent<SVGPathElement>,
      regionId: string,
      countryCode?: string,
    ) => {
      if (suppressClickRef.current || !countryCode) {
        return;
      }

      const area = regionAreas
        .find((item) => item.countryCode === countryCode)
        ?.areas.find((item) => item.id === regionId);

      onRegionSelect(
        event,
        countryCode as DetailCountryCode,
        regionId,
        area?.nameJa ?? regionId,
        area?.nameEn ?? regionId,
      );
    },
    [regionAreas, onRegionSelect],
  );

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ backgroundColor: "#dbeafe" }}>
      <div ref={viewportRef} className="map-viewport absolute inset-0 cursor-grab">
        <div ref={planeRef} className="map-plane">
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label={locale === "en" ? "World map" : "世界地図"}
            className="block h-full w-full select-none"
          >
            <g ref={worldLayerRef} data-world-layer="">
              {countryAreas.map((area) => (
            <AreaPath
              key={area.key}
              areaId={area.id}
              d={area.d}
              label={locale === "en" ? area.nameEn : area.nameJa}
              kind="country"
              score={countryScores[area.id] ?? 0}
              onSelect={handleCountryClick}
            />
          ))}

          {regionAreas.map(({ countryCode, areas }) =>
            areas.map((area) => (
              <AreaPath
                key={area.key}
                areaId={area.id}
                countryCode={countryCode}
                d={area.d}
                label={locale === "en" ? area.nameEn : area.nameJa}
                kind="region"
                score={(regionScores[countryCode]?.[area.id] ?? 0) as Score}
                onSelect={handleRegionClick}
              />
            )),
          )}

          {countryOutlines.map((area) => (
            <path
              key={area.key}
              d={area.d}
              data-stroke="country"
              fill="none"
              stroke={COUNTRY_STROKE}
              strokeWidth={COUNTRY_STROKE_WIDTH}
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
            />
          ))}

          {showMajorCities && (
            <CityMarkers
              projection={projection}
              locale={locale}
            />
          )}
            </g>
          </svg>
        </div>
      </div>

      <div className="absolute right-4 top-4 z-10 flex flex-col gap-1">
        <button
          type="button"
          onClick={zoomIn}
          className="h-8 w-8 rounded-lg border border-slate-200 bg-white/95 text-lg font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          aria-label={locale === "en" ? "Zoom in" : "拡大"}
        >
          +
        </button>
        <button
          type="button"
          onClick={zoomOut}
          className="h-8 w-8 rounded-lg border border-slate-200 bg-white/95 text-lg font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          aria-label={locale === "en" ? "Zoom out" : "縮小"}
        >
          −
        </button>
        <button
          type="button"
          onClick={resetView}
          className="h-8 w-8 rounded-lg border border-slate-200 bg-white/95 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          aria-label={locale === "en" ? "Reset view" : "表示をリセット"}
        >
          ⟲
        </button>
      </div>
    </div>
  );
});

WorldMapCanvas.displayName = "WorldMapCanvas";
