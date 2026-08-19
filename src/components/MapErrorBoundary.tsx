"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface MapErrorBoundaryProps {
  children: ReactNode;
  onRetry?: () => void;
}

interface MapErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class MapErrorBoundary extends Component<
  MapErrorBoundaryProps,
  MapErrorBoundaryState
> {
  state: MapErrorBoundaryState = {
    hasError: false,
    message: "",
  };

  static getDerivedStateFromError(error: Error): MapErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || "地図の描画中にエラーが発生しました",
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Map render error:", error, info);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, message: "" });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="relative h-full min-h-[420px] w-full bg-[#dbeafe]">
          <div className="absolute inset-x-4 top-4 z-20 mx-auto max-w-md rounded-xl border border-red-200 bg-white/95 p-4 text-center shadow-sm">
            <p className="text-sm font-semibold text-red-600">
              一部の地図データを読み飛ばして再描画できます
            </p>
            <p className="mt-2 text-xs text-slate-600">{this.state.message}</p>
            <button
              type="button"
              onClick={this.handleRetry}
              className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              再読み込み
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
