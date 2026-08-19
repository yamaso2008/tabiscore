"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { MapLegend } from "@/components/MapLegend";
import { RegionalMapView } from "@/components/RegionalMapView";
import { ScorePopup } from "@/components/ScorePopup";
import { StatsBar } from "@/components/StatsBar";
import {
  isDetailCountry,
  type DetailCountryCode,
} from "@/constants/detail-countries";
import { getScoreColor, type CountryScores, type Score } from "@/constants/scores";
import {
  getEffectiveCountryScore,
  loadScoreData,
  saveScoreData,
  type RegionScores,
} from "@/lib/scores";
import { calculateStats, type SelectedArea } from "@/lib/stats";

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

function getCountryId(properties: Record<string, string>): string {
  return properties.ISO_A3 || properties.name || "UNKNOWN";
}

function getCountryName(properties: Record<string, string>): string {
  return properties.name || properties.NAME || "Unknown";
}

export function WorldMap() {
  const [countryScores, setCountryScores] = useState<CountryScores>({});
  const [regionScores, setRegionScores] = useState<RegionScores>({});
  const [selectedArea, setSelectedArea] = useState<SelectedArea | null>(null);
  const [detailCountry, setDetailCountry] = useState<DetailCountryCode | null>(
    null,
  );

  useEffect(() => {
    const data = loadScoreData();
    setCountryScores(data.countryScores);
    setRegionScores(data.regionScores);
  }, []);

  useEffect(() => {
    saveScoreData({ countryScores, regionScores });
  }, [countryScores, regionScores]);

  const stats = useMemo(
    () => calculateStats(countryScores, regionScores),
    [countryScores, regionScores],
  );

  const handleCountryClick = useCallback(
    (
      event: React.MouseEvent<SVGPathElement>,
      countryId: string,
      countryName: string,
    ) => {
      setSelectedArea({
        id: countryId,
        name: countryName,
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

      const countryId = selectedArea.id;

      setCountryScores((prev) => {
        if (score === 0) {
          const next = { ...prev };
          delete next[countryId];
          return next;
        }

        return {
          ...prev,
          [countryId]: score,
        };
      });

      if (score === 0 && isDetailCountry(countryId)) {
        setRegionScores((prev) => {
          const next = { ...prev };
          delete next[countryId];
          return next;
        });
      }

      setSelectedArea(null);
    },
    [selectedArea],
  );

  const handleOpenDetail = useCallback(() => {
    if (!selectedArea || !isDetailCountry(selectedArea.id)) {
      return;
    }

    setDetailCountry(selectedArea.id);
    setSelectedArea(null);
  }, [selectedArea]);

  const handleBackToWorld = useCallback(() => {
    setDetailCountry(null);
    setSelectedArea(null);
  }, []);

  if (detailCountry) {
    return (
      <RegionalMapView
        countryCode={detailCountry}
        countryScores={countryScores}
        regionScores={regionScores}
        onRegionScoresChange={setRegionScores}
        onBack={handleBackToWorld}
        worldStats={stats}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <StatsBar stats={stats} />

      <main className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0">
          <ComposableMap
            projection="geoEqualEarth"
            projectionConfig={{ scale: 160 }}
            width={980}
            height={520}
            style={{ width: "100%", height: "100%" }}
          >
            <ZoomableGroup center={[0, 20]} zoom={1} minZoom={0.8} maxZoom={8}>
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const countryId = getCountryId(geo.properties);
                    const countryName = getCountryName(geo.properties);
                    const score = getEffectiveCountryScore(
                      countryId,
                      countryScores,
                      regionScores,
                    );
                    const fillColor = getScoreColor(score);

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onClick={(event) =>
                          handleCountryClick(event, countryId, countryName)
                        }
                        style={{
                          default: {
                            fill: fillColor,
                            stroke: "#94a3b8",
                            strokeWidth: 0.4,
                            outline: "none",
                            transition: "fill 150ms ease",
                          },
                          hover: {
                            fill: score === 0 ? "#cbd5e1" : fillColor,
                            stroke: "#475569",
                            strokeWidth: 0.6,
                            outline: "none",
                            cursor: "pointer",
                            opacity: score === 0 ? 1 : 0.85,
                          },
                          pressed: {
                            fill: fillColor,
                            stroke: "#1e293b",
                            strokeWidth: 0.8,
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
          currentScore={getEffectiveCountryScore(
            selectedArea.id,
            countryScores,
            regionScores,
          )}
          onSelect={handleScoreSelect}
          onClose={() => setSelectedArea(null)}
          showDetailButton={isDetailCountry(selectedArea.id)}
          onOpenDetail={handleOpenDetail}
        />
      )}
    </div>
  );
}
