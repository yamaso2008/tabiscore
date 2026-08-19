"use client";

import { useEffect } from "react";
import { SCORE_OPTIONS, type Score } from "@/constants/scores";
import { useLocale } from "@/i18n/LocaleContext";
import { getRegionTypeLabel, getScoreText } from "@/i18n/messages";
import type { SelectedArea } from "@/lib/stats";

interface ScorePopupProps {
  area: SelectedArea;
  currentScore: Score;
  onSelect: (score: Score) => void;
  onClose: () => void;
}

export function ScorePopup({
  area,
  currentScore,
  onSelect,
  onClose,
}: ScorePopupProps) {
  const { locale, t } = useLocale();
  const displayName =
    locale === "en"
      ? (area.nameEn ?? area.name)
      : (area.nameJa ?? area.name);
  const countryName =
    locale === "en"
      ? (area.countryNameEn ?? area.countryName)
      : (area.countryNameJa ?? area.countryName);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <>
      <button
        type="button"
        aria-label={t.close}
        className="fixed inset-0 z-[60] bg-black/20"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-label={`${displayName}${countryName ? ` / ${countryName}` : ""} ${t.selectScore}`}
        className="fixed z-[70] w-64 -translate-x-1/2 -translate-y-full rounded-xl border border-slate-200 bg-white p-3 shadow-xl"
        style={{
          left: area.position.x,
          top: area.position.y - 12,
        }}
      >
        <div className="mb-3 border-b border-slate-100 pb-2">
          <p className="text-sm font-semibold text-slate-900">
            {area.kind === "region" && countryName
              ? `${displayName} / ${countryName}`
              : displayName}
          </p>
          <p className="text-xs text-slate-500">
            {area.kind === "region"
              ? (area.regionLabel ||
                  getRegionTypeLabel(t, area.countryCode) ||
                  t.selectScore)
              : t.selectScore}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {SCORE_OPTIONS.map((option) => {
            const isSelected = currentScore === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onSelect(option.value)}
                className={`rounded-lg border px-2 py-2 text-xs font-medium transition ${
                  isSelected
                    ? "border-slate-900 ring-2 ring-slate-900 ring-offset-1"
                    : "border-slate-200 hover:border-slate-300"
                }`}
                style={{ backgroundColor: option.color }}
              >
                <span className="block text-[10px] text-slate-600">
                  {option.value}
                </span>
                <span className="block text-slate-900">
                  {getScoreText(t, option.value)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
