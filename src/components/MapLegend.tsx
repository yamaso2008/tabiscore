"use client";

import { useLocale } from "@/i18n/LocaleContext";
import { getScoreText } from "@/i18n/messages";

export function MapLegend() {
  const { t } = useLocale();

  return (
    <div className="pointer-events-none rounded-lg border border-slate-200 bg-white/95 p-3 text-xs text-slate-600 shadow-sm">
      <p className="mb-2 font-semibold text-slate-800">{t.legend}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <span>0 {getScoreText(t, 0)}</span>
        <span>3 {getScoreText(t, 3)}</span>
        <span>1 {getScoreText(t, 1)}</span>
        <span>4 {getScoreText(t, 4)}</span>
        <span>2 {getScoreText(t, 2)}</span>
        <span>5 {getScoreText(t, 5)}</span>
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-slate-400">
        {t.legendNote}
      </p>
    </div>
  );
}
