"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import {
  APP_VERSION,
  formatLastUpdated,
} from "@/constants/version";
import { useLocale } from "@/i18n/LocaleContext";
import { clearScoreData } from "@/lib/scores";

interface SettingsMenuProps {
  onReset: () => void;
  showMajorCities: boolean;
  onToggleMajorCities: (show: boolean) => void;
}

export function SettingsMenu({
  onReset,
  showMajorCities,
  onToggleMajorCities,
}: SettingsMenuProps) {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const updatePosition = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const width = 280;
      const margin = 16;
      const left = Math.min(
        Math.max(margin, rect.right - width),
        window.innerWidth - width - margin,
      );

      setPanelStyle({
        top: rect.bottom + 8,
        left,
        width,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleReset = () => {
    if (!window.confirm(t.resetConfirm)) {
      return;
    }

    clearScoreData();
    onReset();
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative z-[100]">
      <button
        type="button"
        aria-label={t.settings}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        ⚙️
      </button>

      {open &&
        mounted &&
        createPortal(
          <div
            ref={panelRef}
            role="menu"
            className="fixed z-[100] rounded-xl border border-slate-200 bg-white p-3 shadow-xl"
            style={panelStyle}
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t.language}
            </p>
            <div className="mb-3 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setLocale("ja")}
                className={`rounded-md px-2 py-1.5 text-sm font-medium ${
                  locale === "ja"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600"
                }`}
              >
                {t.japanese}
              </button>
              <button
                type="button"
                onClick={() => setLocale("en")}
                className={`rounded-md px-2 py-1.5 text-sm font-medium ${
                  locale === "en"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600"
                }`}
              >
                {t.english}
              </button>
            </div>
            <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-sm font-medium text-slate-800">
                {t.showMajorCities}
              </p>
              <button
                type="button"
                role="switch"
                aria-checked={showMajorCities}
                onClick={() => onToggleMajorCities(!showMajorCities)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                  showMajorCities ? "bg-slate-900" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                    showMajorCities ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
            >
              {t.resetScores}
            </button>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-slate-100 pt-2.5 text-[10px] leading-relaxed text-slate-400">
              <span className="font-medium tracking-wide">
                {t.version} {APP_VERSION}
              </span>
              <span>
                {t.lastUpdated} {formatLastUpdated(locale)}
              </span>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
