"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "@/i18n/LocaleContext";
import { downloadMapPng, openTwitterShare } from "@/lib/export-map";
import type { MapStats } from "@/lib/stats";

interface ShareMenuProps {
  stats: MapStats;
  getSvg: () => SVGSVGElement | null;
}

export function ShareMenu({ stats, getSvg }: ShareMenuProps) {
  const { locale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const handleSaveImage = async () => {
    const svg = getSvg();
    if (!svg) {
      window.alert(t.exportFailed);
      return;
    }

    setBusy(true);
    try {
      await downloadMapPng(svg, stats, {
        title: t.title,
        totalScore: t.totalScore,
        visitedCountries: t.visitedCountries,
        visitedRegions: t.visitedRegions,
        legend: t.legend,
        scoreLabels: {
          0: t.scores[0],
          1: t.scores[1],
          2: t.scores[2],
          3: t.scores[3],
          4: t.scores[4],
          5: t.scores[5],
        },
        fileName: locale === "en" ? "earth-score.png" : "tabi-score.png",
      });
      setOpen(false);
    } catch {
      window.alert(t.exportFailed);
    } finally {
      setBusy(false);
    }
  };

  const handleShareX = () => {
    openTwitterShare(t.tweet(stats));
    setOpen(false);
  };

  return (
    <div className="relative z-[100]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        {t.share}
      </button>

      {open &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 pt-24 sm:items-center sm:pt-4">
            <button
              type="button"
              aria-label={t.close}
              className="absolute inset-0 bg-slate-900/40"
              onClick={() => setOpen(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label={t.share}
              className="relative z-[110] my-auto w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-slate-900">
                    {t.share}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {t.totalScore} {stats.totalScore} / {t.visitedCountries}{" "}
                    {stats.visitedCount} / {t.visitedRegions}{" "}
                    {stats.visitedRegionCount}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
                  aria-label={t.close}
                >
                  ✕
                </button>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => void handleSaveImage()}
                  disabled={busy}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-white disabled:opacity-60"
                >
                  {busy ? "..." : t.saveImage}
                </button>
                <button
                  type="button"
                  onClick={handleShareX}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-white"
                >
                  {t.shareOnX}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
