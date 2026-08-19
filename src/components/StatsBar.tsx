"use client";

import type { MapStats } from "@/lib/stats";

interface StatsBarProps {
  stats: MapStats;
}

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <header className="border-b border-slate-200 bg-white/90 px-4 py-4 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">世界経県値</h1>
          <p className="text-sm text-slate-500">
            国をクリックして訪問スコアを記録しましょう
          </p>
        </div>
        <div className="flex gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              合計スコア
            </p>
            <p className="text-2xl font-bold text-slate-900">{stats.totalScore}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              訪問国数
            </p>
            <p className="text-2xl font-bold text-slate-900">{stats.visitedCount}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
