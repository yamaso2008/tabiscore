"use client";

import { SCORE_OPTIONS } from "@/constants/scores";
import type { Score } from "@/constants/scores";
import type { SelectedArea } from "@/lib/stats";

interface ScorePopupProps {
  area: SelectedArea;
  currentScore: Score;
  onSelect: (score: Score) => void;
  onClose: () => void;
  showDetailButton?: boolean;
  onOpenDetail?: () => void;
}

export function ScorePopup({
  area,
  currentScore,
  onSelect,
  onClose,
  showDetailButton = false,
  onOpenDetail,
}: ScorePopupProps) {
  return (
    <>
      <button
        type="button"
        aria-label="閉じる"
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
      />
      <div
        className="fixed z-50 w-64 -translate-x-1/2 -translate-y-full rounded-xl border border-slate-200 bg-white p-3 shadow-xl"
        style={{
          left: area.position.x,
          top: area.position.y - 12,
        }}
      >
        <div className="mb-3 border-b border-slate-100 pb-2">
          <p className="text-sm font-semibold text-slate-900">{area.name}</p>
          <p className="text-xs text-slate-500">スコアを選択</p>
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
                <span className="block text-slate-900">{option.label}</span>
              </button>
            );
          })}
        </div>
        {showDetailButton && onOpenDetail && (
          <button
            type="button"
            onClick={onOpenDetail}
            className="mt-3 w-full rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
          >
            州/県ごとの詳細を入力
          </button>
        )}
      </div>
    </>
  );
}
