"use client";

import { SettingsMenu } from "@/components/SettingsMenu";
import { ShareMenu } from "@/components/ShareMenu";
import { useLocale } from "@/i18n/LocaleContext";
import type { MapStats } from "@/lib/stats";

interface StatsBarProps {
  stats: MapStats;
  onReset: () => void;
  getSvg: () => SVGSVGElement | null;
  showMajorCities: boolean;
  onToggleMajorCities: (show: boolean) => void;
}

export function StatsBar({
  stats,
  onReset,
  getSvg,
  showMajorCities,
  onToggleMajorCities,
}: StatsBarProps) {
  const { t } = useLocale();

  return (
    <header className="relative z-40 overflow-visible border-b border-slate-200 bg-white/90 px-4 py-4 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t.title}</h1>
          <p className="text-sm text-slate-500">{t.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {t.totalScore}
            </p>
            <p className="text-2xl font-bold text-slate-900">{stats.totalScore}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {t.visitedCountries}
            </p>
            <p className="text-2xl font-bold text-slate-900">{stats.visitedCount}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {t.visitedRegions}
            </p>
            <p className="text-2xl font-bold text-slate-900">
              {stats.visitedRegionCount}
            </p>
          </div>
          <ShareMenu stats={stats} getSvg={getSvg} />
          <SettingsMenu
            onReset={onReset}
            showMajorCities={showMajorCities}
            onToggleMajorCities={onToggleMajorCities}
          />
        </div>
      </div>
    </header>
  );
}
