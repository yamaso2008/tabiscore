"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { MapLegend } from "@/components/MapLegend";
import { ScorePopup } from "@/components/ScorePopup";
import { StatsBar } from "@/components/StatsBar";
import {
  DETAIL_COUNTRIES,
  getRegionId,
  getRegionName,
  type DetailCountryCode,
} from "@/constants/detail-countries";
import { getScoreColor, type Score } from "@/constants/scores";
import { getCountryStats, type SelectedArea } from "@/lib/stats";
import type { RegionScores } from "@/lib/scores";
import type { CountryScores } from "@/constants/scores";

interface RegionalMapViewProps {
  countryCode: DetailCountryCode;
  countryScores: CountryScores;
  regionScores: RegionScores;
  onRegionScoresChange: (regionScores: RegionScores) => void;
  onBack: () => void;
  worldStats: { totalScore: number; visitedCount: number };
}

export function RegionalMapView({
  countryCode,
  countryScores,
  regionScores,
  onRegionScoresChange,
  onBack,
  worldStats,
}: RegionalMapViewProps) {
  const config = DETAIL_COUNTRIES[countryCode];
  const [selectedArea, setSelectedArea] = useState<SelectedArea | null>(null);

  const countryRegionScores = useMemo(
    () => regionScores[countryCode] ?? {},
    [regionScores, countryCode],
  );
  const countryStats = useMemo(
    () => getCountryStats(countryCode, countryScores, regionScores),
    [countryCode, countryScores, regionScores],
  );

  const handleRegionClick = useCallback(
    (
      event: React.MouseEvent<SVGPathElement>,
      regionId: string,
      regionName: string,
    ) => {
      setSelectedArea({
        id: regionId,
        name: regionName,
        position: {
          x: event.clientX,
          y: event.clientY,
        },
      });
    },
    [],
  );

  const handleScoreSelect = useCallback(
    (score: Score) => {
      if (!selectedArea) {
        return;
      }

      const nextRegions = { ...countryRegionScores };

      if (score === 0) {
        delete nextRegions[selectedArea.id];
      } else {
        nextRegions[selectedArea.id] = score;
      }

      const nextRegionScores = { ...regionScores };

      if (Object.keys(nextRegions).length === 0) {
        delete nextRegionScores[countryCode];
      } else {
        nextRegionScores[countryCode] = nextRegions;
      }

      onRegionScoresChange(nextRegionScores);
      setSelectedArea(null);
    },
    [
      selectedArea,
      regionScores,
      countryCode,
      countryRegionScores,
      onRegionScoresChange,
    ],
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <StatsBar stats={worldStats} />

      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              type="button"
              onClick={onBack}
              className="mb-2 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              ← 世界地図に戻る
            </button>
            <h2 className="text-lg font-bold text-slate-900">
              {config.name}（{config.regionLabel}別）
            </h2>
            <p className="text-sm text-slate-500">
              {config.regionLabel}をクリックしてスコアを設定できます
            </p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                国スコア（最高）
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {countryStats.displayScore}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                記録{config.regionLabel}数
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {countryStats.regionCount}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {config.regionLabel}合計
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {countryStats.contribution}
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0">
          <ComposableMap
            projection={config.projection}
            projectionConfig={config.projectionConfig}
            width={980}
            height={520}
            style={{ width: "100%", height: "100%" }}
          >
            <ZoomableGroup
              center={
                Array.isArray(config.projectionConfig.center)
                  ? (config.projectionConfig.center as [number, number])
                  : [0, 0]
              }
              zoom={1}
              minZoom={0.8}
              maxZoom={8}
            >
              <Geographies geography={config.geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const regionId = getRegionId(countryCode, geo.properties);
                    const regionName = getRegionName(countryCode, geo.properties);
                    const score = countryRegionScores[regionId] ?? 0;
                    const fillColor = getScoreColor(score);

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onClick={(event) =>
                          handleRegionClick(event, regionId, regionName)
                        }
                        style={{
                          default: {
                            fill: fillColor,
                            stroke: "#94a3b8",
                            strokeWidth: 0.5,
                            outline: "none",
                            transition: "fill 150ms ease",
                          },
                          hover: {
                            fill: score === 0 ? "#cbd5e1" : fillColor,
                            stroke: "#475569",
                            strokeWidth: 0.7,
                            outline: "none",
                            cursor: "pointer",
                            opacity: score === 0 ? 1 : 0.85,
                          },
                          pressed: {
                            fill: fillColor,
                            stroke: "#1e293b",
                            strokeWidth: 0.9,
                            outline: "none",
                          },
                        }}
                      />
                    );
                  })
                }
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>
        </div>

        <div className="absolute bottom-4 left-4">
          <MapLegend />
        </div>
      </main>

      {selectedArea && (
        <ScorePopup
          area={selectedArea}
          currentScore={countryRegionScores[selectedArea.id] ?? 0}
          onSelect={handleScoreSelect}
          onClose={() => setSelectedArea(null)}
        />
      )}
    </div>
  );
}
