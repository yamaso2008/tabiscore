"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchFeatures, type GeographyFeature } from "@/lib/geography";

interface GeographyLoadState {
  features: GeographyFeature[] | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export function useGeographyLoader(
  url: string,
  objectName?: string,
): GeographyLoadState {
  const [features, setFeatures] = useState<GeographyFeature[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const loaded = await fetchFeatures(url, objectName);

        if (!cancelled) {
          setFeatures(loaded);
          setLoading(false);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "地図データの読み込みに失敗しました",
          );
          setFeatures(null);
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [url, objectName, retryCount]);

  const retry = useCallback(() => setRetryCount((count) => count + 1), []);

  return { features, loading, error, retry };
}

interface RegionLoadState<T extends string> {
  features: Partial<Record<T, GeographyFeature[]>>;
  loading: boolean;
  errors: Partial<Record<T, string>>;
  retry: () => void;
}

/** 各地域データを個別に読み込み、成功したものから順次反映する */
export function useRegionGeographyLoaders<T extends string>(
  urls: Record<T, string>,
): RegionLoadState<T> {
  const [features, setFeatures] = useState<Partial<Record<T, GeographyFeature[]>>>(
    {},
  );
  const [errors, setErrors] = useState<Partial<Record<T, string>>>({});
  const [pendingCount, setPendingCount] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const urlsKey = JSON.stringify(urls);

  useEffect(() => {
    let cancelled = false;
    const entries = Object.entries(JSON.parse(urlsKey) as Record<T, string>) as [
      T,
      string,
    ][];

    setFeatures({});
    setErrors({});
    setPendingCount(entries.length);

    entries.forEach(([key, url]) => {
      void fetchFeatures(url)
        .then((loaded) => {
          if (cancelled) {
            return;
          }
          setFeatures((prev) => ({ ...prev, [key]: loaded }));
        })
        .catch((loadError: unknown) => {
          if (cancelled) {
            return;
          }
          setErrors((prev) => ({
            ...prev,
            [key]:
              loadError instanceof Error
                ? loadError.message
                : "読み込みに失敗しました",
          }));
        })
        .finally(() => {
          if (cancelled) {
            return;
          }
          setPendingCount((count) => Math.max(0, count - 1));
        });
    });

    return () => {
      cancelled = true;
    };
  }, [urlsKey, retryCount]);

  const retry = useCallback(() => setRetryCount((count) => count + 1), []);

  return { features, loading: pendingCount > 0, errors, retry };
}
