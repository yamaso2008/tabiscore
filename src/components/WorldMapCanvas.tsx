"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
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

const MIN_ZOOM = 1;
const MAX_ZOOM = 24;
/** これ以下の移動量はクリック扱いにする（ドラッグとクリックの誤判定を防ぐ） */
const DRAG_THRESHOLD_PX = 4;

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
    },
    ref,
  ) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  const zoomRef = useRef(zoom);
  const offsetRef = useRef(offset);
  const suppressClickRef = useRef(false);

  useImperativeHandle(ref, () => ({
    getSvg: () => svgRef.current,
  }));

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

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

  const handleWheel = useCallback((event: React.WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    const factor = event.deltaY < 0 ? 1.2 : 1 / 1.2;
    setZoom((current) =>
      Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current * factor)),
    );
  }, []);

  /**
   * パン操作は window のリスナーで処理する。SVG に setPointerCapture すると
   * click イベントのターゲットが SVG に付け替えられ、path の onClick が発火しない。
   */
  const handlePointerDown = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      if (event.button !== 0) {
        return;
      }

      suppressClickRef.current = false;

      const rect = svgRef.current?.getBoundingClientRect();
      const scaleX = rect ? MAP_WIDTH / rect.width : 1;
      const scaleY = rect ? MAP_HEIGHT / rect.height : 1;
      const startX = event.clientX;
      const startY = event.clientY;
      const origin = offsetRef.current;
      const startZoom = zoomRef.current;
      let hasMoved = false;

      const handleMove = (moveEvent: PointerEvent) => {
        const rawDx = moveEvent.clientX - startX;
        const rawDy = moveEvent.clientY - startY;

        if (!hasMoved) {
          if (Math.hypot(rawDx, rawDy) <= DRAG_THRESHOLD_PX) {
            return;
          }
          hasMoved = true;
          setIsPanning(true);
        }

        setOffset({
          x: origin.x + (rawDx * scaleX) / startZoom,
          y: origin.y + (rawDy * scaleY) / startZoom,
        });
      };

      const handleUp = () => {
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);
        window.removeEventListener("pointercancel", handleUp);
        suppressClickRef.current = hasMoved;
        setIsPanning(false);
      };

      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
      window.addEventListener("pointercancel", handleUp);
    },
    [],
  );

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

  const resetView = useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  return (
    <div className="relative h-full w-full">
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={locale === "en" ? "World map" : "世界地図"}
        className={`block h-full w-full touch-none select-none ${
          isPanning ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{ backgroundColor: "#dbeafe" }}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
      >
        <g
          transform={`translate(${MAP_WIDTH / 2} ${MAP_HEIGHT / 2}) scale(${zoom}) translate(${-MAP_WIDTH / 2 + offset.x} ${-MAP_HEIGHT / 2 + offset.y})`}
        >
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
              zoom={zoom}
              locale={locale}
            />
          )}
        </g>
      </svg>

      <div className="absolute right-4 top-4 z-10 flex flex-col gap-1">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z * 1.4))}
          className="h-8 w-8 rounded-lg border border-slate-200 bg-white/95 text-lg font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          aria-label={locale === "en" ? "Zoom in" : "拡大"}
        >
          +
        </button>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z / 1.4))}
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
