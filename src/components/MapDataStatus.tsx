interface MapDataStatusProps {
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  variant?: "overlay" | "banner";
  message?: string;
  errorTitle?: string;
  retryLabel?: string;
}

export function MapDataStatus({
  loading = false,
  error = null,
  onRetry,
  variant = "overlay",
  message,
  errorTitle,
  retryLabel,
}: MapDataStatusProps) {
  if (!loading && !error) {
    return null;
  }

  if (variant === "banner") {
    return (
      <div className="pointer-events-auto absolute right-4 top-4 z-20 max-w-xs rounded-lg border border-slate-200 bg-white/95 p-3 text-xs shadow-sm backdrop-blur">
        {loading ? (
          <p className="font-medium text-slate-700">
            {message ?? "州・都道府県・省データを読み込み中..."}
          </p>
        ) : (
          <>
            <p className="font-medium text-amber-700">
              {errorTitle ?? "詳細地図の一部を読み込めませんでした"}
            </p>
            <p className="mt-1 text-slate-600">{error}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-2 rounded-md border border-slate-200 px-2 py-1 text-slate-700 hover:bg-slate-50"
              >
                {retryLabel ?? "再試行"}
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-100/90 backdrop-blur-sm">
      <div className="mx-4 max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center shadow-lg">
        {loading ? (
          <>
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500" />
            <p className="text-sm font-medium text-slate-800">
              {message ?? "地図データを読み込み中..."}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-red-600">
              {errorTitle ?? "地図の表示に失敗しました"}
            </p>
            <p className="mt-2 text-xs text-slate-600">{error}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                {retryLabel ?? "再読み込み"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
