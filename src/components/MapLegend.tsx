export function MapLegend() {
  return (
    <div className="pointer-events-none rounded-lg border border-slate-200 bg-white/95 p-3 text-xs text-slate-600 shadow-sm">
      <p className="mb-2 font-semibold text-slate-800">凡例</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <span>0 未踏</span>
        <span>3 訪問</span>
        <span>1 通過</span>
        <span>4 宿泊</span>
        <span>2 接地</span>
        <span>5 居住</span>
      </div>
    </div>
  );
}
