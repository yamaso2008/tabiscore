"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapDataStatus } from "@/components/MapDataStatus";
import { MapErrorBoundary } from "@/components/MapErrorBoundary";
import { MapLegend } from "@/components/MapLegend";
import { ScorePopup } from "@/components/ScorePopup";
import { StatsBar } from "@/components/StatsBar";
import {
  WorldMapCanvas,
  type WorldMapCanvasHandle,
} from "@/components/WorldMapCanvas";
import {
  REGION_GEO_URLS,
  WORLD_GEO_URL,
  getDetailCountryDisplayName,
  type DetailCountryCode,
} from "@/constants/detail-countries";
import type { CountryScores, Score } from "@/constants/scores";
import {
  useGeographyLoader,
  useRegionGeographyLoaders,
} from "@/hooks/useGeographyData";
import { LocaleProvider, useLocale } from "@/i18n/LocaleContext";
import { getRegionTypeLabel } from "@/i18n/messages";
import { getPopupPosition } from "@/lib/map-styles";
import { loadScoreData, saveScoreData, type RegionScores } from "@/lib/scores";
import {
  loadShowMajorCities,
  saveShowMajorCities,
} from "@/lib/preferences";
import { calculateStats, type SelectedArea } from "@/lib/stats";

function getSelectedScore(
  selectedArea: SelectedArea,
  countryScores: CountryScores,
  regionScores: RegionScores,
): Score {
  if (selectedArea.kind === "region" && selectedArea.countryCode) {
    return regionScores[selectedArea.countryCode]?.[selectedArea.id] ?? 0;
  }

  return countryScores[selectedArea.id] ?? 0;
}

function WorldMapInner() {
  const { locale, t } = useLocale();
  const mapRef = useRef<WorldMapCanvasHandle>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [countryScores, setCountryScores] = useState<CountryScores>({});
  const [regionScores, setRegionScores] = useState<RegionScores>({});
  const [selectedArea, setSelectedArea] = useState<SelectedArea | null>(null);
  const [mapRetryKey, setMapRetryKey] = useState(0);
  const [showMajorCities, setShowMajorCities] = useState(true);

  const {
    features: worldFeatures,
    loading: worldLoading,
    error: worldError,
    retry: retryWorld,
  } = useGeographyLoader(WORLD_GEO_URL);

  const {
    features: regionFeatures,
    loading: regionsLoading,
    errors: regionErrors,
    retry: retryRegions,
  } = useRegionGeographyLoaders(REGION_GEO_URLS);

  useEffect(() => {
    setHasMounted(true);
    const data = loadScoreData();
    setCountryScores(data.countryScores);
    setRegionScores(data.regionScores);
    setShowMajorCities(loadShowMajorCities());
  }, []);

  useEffect(() => {
    if (!hasMounted) {
      return;
    }

    saveScoreData({ countryScores, regionScores });
  }, [hasMounted, countryScores, regionScores]);

  const stats = useMemo(
    () => calculateStats(countryScores, regionScores),
    [countryScores, regionScores],
  );

  const regionErrorMessage = useMemo(() => {
    const messages = Object.entries(regionErrors).map(
      ([code, message]) => `${code}: ${message}`,
    );

    return messages.length > 0 ? messages.join(" / ") : null;
  }, [regionErrors]);

  const handleCountrySelect = useCallback(
    (
      event: React.MouseEvent<SVGPathElement>,
      countryId: string,
      nameJa: string,
      nameEn: string,
    ) => {
      setSelectedArea({
        id: countryId,
        name: locale === "en" ? nameEn : nameJa,
        nameJa,
        nameEn,
        kind: "country",
        position: getPopupPosition(event.clientX, event.clientY),
      });
    },
    [locale],
  );

  const handleRegionSelect = useCallback(
    (
      event: React.MouseEvent<SVGPathElement>,
      countryCode: DetailCountryCode,
      regionId: string,
      nameJa: string,
      nameEn: string,
    ) => {
      const countryNameJa = getDetailCountryDisplayName(countryCode, "ja");
      const countryNameEn = getDetailCountryDisplayName(countryCode, "en");

      setSelectedArea({
        id: regionId,
        name: locale === "en" ? nameEn : nameJa,
        nameJa,
        nameEn,
        kind: "region",
        countryCode,
        countryName: locale === "en" ? countryNameEn : countryNameJa,
        countryNameJa,
        countryNameEn,
        regionLabel: getRegionTypeLabel(t, countryCode),
        position: getPopupPosition(event.clientX, event.clientY),
      });
    },
    [locale, t],
  );

  const handleScoreSelect = useCallback(
    (score: Score) => {
      if (!selectedArea) {
        return;
      }

      if (selectedArea.kind === "region" && selectedArea.countryCode) {
        const countryCode = selectedArea.countryCode;

        setRegionScores((prev) => {
          const currentRegions = { ...(prev[countryCode] ?? {}) };

          if (score === 0) {
            delete currentRegions[selectedArea.id];
          } else {
            currentRegions[selectedArea.id] = score;
          }

          const next = { ...prev };

          if (Object.keys(currentRegions).length === 0) {
            delete next[countryCode];
          } else {
            next[countryCode] = currentRegions;
          }

          return next;
        });

        setCountryScores((prev) => {
          if (!(countryCode in prev)) {
            return prev;
          }

          const next = { ...prev };
          delete next[countryCode];
          return next;
        });
      } else {
        const countryId = selectedArea.id;

        setCountryScores((prev) => {
          if (score === 0) {
            const next = { ...prev };
            delete next[countryId];
            return next;
          }

          return { ...prev, [countryId]: score };
        });
      }

      setSelectedArea(null);
    },
    [selectedArea],
  );

  const handleMapRetry = useCallback(() => {
    setMapRetryKey((key) => key + 1);
    retryWorld();
    retryRegions();
  }, [retryWorld, retryRegions]);

  const handleReset = useCallback(() => {
    setCountryScores({});
    setRegionScores({});
    setSelectedArea(null);
  }, []);

  const handleToggleMajorCities = useCallback((show: boolean) => {
    setShowMajorCities(show);
    saveShowMajorCities(show);
  }, []);

  const showWorldOverlay = !hasMounted || worldLoading || Boolean(worldError);

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <StatsBar
        stats={stats}
        onReset={handleReset}
        getSvg={() => mapRef.current?.getSvg() ?? null}
        showMajorCities={showMajorCities}
        onToggleMajorCities={handleToggleMajorCities}
      />

      <main className="relative z-0 min-h-[480px] flex-1 overflow-hidden">
        {showWorldOverlay && (
          <MapDataStatus
            loading={!hasMounted || worldLoading}
            error={worldError}
            onRetry={retryWorld}
            message={t.loadingWorld}
            errorTitle={t.loadFailed}
            retryLabel={t.reload}
          />
        )}

        {hasMounted && !worldLoading && !worldError && regionsLoading && (
          <MapDataStatus variant="banner" loading message={t.loadingRegions} />
        )}

        {hasMounted && !worldLoading && !worldError && regionErrorMessage && (
          <MapDataStatus
            variant="banner"
            error={regionErrorMessage}
            onRetry={retryRegions}
            errorTitle={t.loadPartialFailed}
            retryLabel={t.retry}
          />
        )}

        <div className="absolute inset-0">
          {hasMounted && worldFeatures && (
            <MapErrorBoundary key={mapRetryKey} onRetry={handleMapRetry}>
              <WorldMapCanvas
                ref={mapRef}
                locale={locale}
                worldFeatures={worldFeatures}
                regionFeatures={regionFeatures}
                countryScores={countryScores}
                regionScores={regionScores}
                onCountrySelect={handleCountrySelect}
                onRegionSelect={handleRegionSelect}
                showMajorCities={showMajorCities}
              />
            </MapErrorBoundary>
          )}
        </div>

        <div className="pointer-events-none absolute bottom-4 left-4 z-10">
          <MapLegend />
        </div>
      </main>

      {selectedArea && (
        <ScorePopup
          area={selectedArea}
          currentScore={getSelectedScore(
            selectedArea,
            countryScores,
            regionScores,
          )}
          onSelect={handleScoreSelect}
          onClose={() => setSelectedArea(null)}
        />
      )}
    </div>
  );
}

export function WorldMap() {
  return (
    <LocaleProvider>
      <WorldMapInner />
    </LocaleProvider>
  );
}
