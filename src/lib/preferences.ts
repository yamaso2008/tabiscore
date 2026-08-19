export const SHOW_CITIES_STORAGE_KEY = "world-keiken-chi-show-cities";

export function loadShowMajorCities(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  const stored = window.localStorage.getItem(SHOW_CITIES_STORAGE_KEY);
  if (stored === "0" || stored === "false") {
    return false;
  }

  return true;
}

export function saveShowMajorCities(show: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SHOW_CITIES_STORAGE_KEY, show ? "1" : "0");
}
