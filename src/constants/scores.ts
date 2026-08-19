export type Score = 0 | 1 | 2 | 3 | 4 | 5;

export type CountryScores = Record<string, Score>;

export interface ScoreOption {
  value: Score;
  label: string;
  color: string;
  hoverColor: string;
}

export const SCORE_OPTIONS: ScoreOption[] = [
  { value: 0, label: "未踏", color: "#e5e7eb", hoverColor: "#d1d5db" },
  { value: 1, label: "通過", color: "#7dd3fc", hoverColor: "#38bdf8" },
  { value: 2, label: "接地", color: "#3b82f6", hoverColor: "#2563eb" },
  { value: 3, label: "訪問", color: "#22c55e", hoverColor: "#16a34a" },
  { value: 4, label: "宿泊", color: "#f97316", hoverColor: "#ea580c" },
  { value: 5, label: "居住", color: "#ef4444", hoverColor: "#dc2626" },
];

export const SCORE_COLORS: Record<Score, string> = {
  0: "#e5e7eb",
  1: "#7dd3fc",
  2: "#3b82f6",
  3: "#22c55e",
  4: "#f97316",
  5: "#ef4444",
};

export const STORAGE_KEY = "world-keiken-chi-scores";
export const REGION_STORAGE_KEY = "world-keiken-chi-region-scores";

export function getScoreColor(score: Score): string {
  return SCORE_COLORS[score];
}

export function getScoreLabel(score: Score): string {
  return SCORE_OPTIONS.find((option) => option.value === score)?.label ?? "未踏";
}
