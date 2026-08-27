"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import { MAP_HEIGHT, MAP_WIDTH } from "@/lib/map-styles";

export const MIN_ZOOM = 1;
/** 台湾の県・市や日本の市区レベルまで指でタップできる倍率まで許容する */
export const MAX_ZOOM = 96;

const CX = MAP_WIDTH / 2;
const CY = MAP_HEIGHT / 2;
const DRAG_THRESHOLD_PX = 4;
const TAP_SLOP_PX = 32;
const DOUBLE_TAP_MS = 300;
const TWO_FINGER_TAP_MS = 300;
const TAP_ZOOM_STEP = 2;
const BUTTON_ZOOM_STEP = 1.8;
const ZOOM_ANIM_MS = 220;
const IDLE_MS = 90;
const INERTIA_STOP = 0.03;
const INERTIA_START = 0.35;
const FRICTION = 0.0045;
const PINCH_TOLERANCE = 0.05;

export interface MapView {
  zoom: number;
  offset: { x: number; y: number };
}

interface UseMapGesturesOptions {
  viewportRef: RefObject<HTMLElement | null>;
  planeRef: RefObject<HTMLElement | null>;
  worldLayerRef: RefObject<SVGGElement | null>;
  onViewIdle?: (view: MapView) => void;
  onSuppressClickChange?: (suppress: boolean) => void;
  onTapZoom?: () => void;
}

function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

export function useMapGestures({
  viewportRef,
  planeRef,
  worldLayerRef,
  onViewIdle,
  onSuppressClickChange,
  onTapZoom,
}: UseMapGesturesOptions) {
  /** ジェスチャー中の CSS 合成レイヤー（パン中はほぼ translate のみ） */
  const htmlScaleRef = useRef(1);
  const htmlTxRef = useRef(0);
  const htmlTyRef = useRef(0);
  /** 静止時に SVG へ焼き込んだカメラ（ユーザー座標）。指を離すとここで再描画してシャープにする */
  const bakedScaleRef = useRef(1);
  const bakedUxRef = useRef(0);
  const bakedUyRef = useRef(0);
  const fitRef = useRef(1);
  const originRef = useRef({ x: 0, y: 0 });
  const overlayScaleRef = useRef(1);

  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const panRef = useRef<{
    x: number;
    y: number;
    tx: number;
    ty: number;
  } | null>(null);
  const pinchRef = useRef<{
    distance: number;
    htmlScale: number;
    localX: number;
    localY: number;
  } | null>(null);
  const downRef = useRef({ x: 0, y: 0 });
  const movedRef = useRef(false);
  const multiTouchRef = useRef(false);
  const twoFingerTapRef = useRef<{
    time: number;
    x: number;
    y: number;
    valid: boolean;
    handled: boolean;
  } | null>(null);
  const lastTapRef = useRef<{ t: number; x: number; y: number } | null>(null);
  const lastSampleRef = useRef<{ x: number; y: number; t: number } | null>(
    null,
  );
  const velocityRef = useRef({ x: 0, y: 0 });

  const rafRef = useRef<number | null>(null);
  const dirtyRef = useRef(true);
  const interactingRef = useRef(false);
  const inertiaRef = useRef(false);
  const tweenRef = useRef<{
    start: number;
    fromScale: number;
    toScale: number;
    localX: number;
    localY: number;
    clientX: number;
    clientY: number;
  } | null>(null);
  const idleTimerRef = useRef<number | null>(null);
  const inertiaStateRef = useRef({ last: 0, vx: 0, vy: 0 });

  const callbacksRef = useRef({
    onViewIdle,
    onSuppressClickChange,
    onTapZoom,
  });
  callbacksRef.current = { onViewIdle, onSuppressClickChange, onTapZoom };

  const logicalZoom = () => bakedScaleRef.current * htmlScaleRef.current;

  const cacheMetrics = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const rect = viewport.getBoundingClientRect();
    originRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    fitRef.current = Math.max(
      0.001,
      Math.min(rect.width / MAP_WIDTH, rect.height / MAP_HEIGHT),
    );
  }, [viewportRef]);

  const applyLabels = useCallback(() => {
    const plane = planeRef.current;
    if (!plane) {
      return;
    }

    const labelScale = 1 / logicalZoom();
    if (Math.abs(labelScale - overlayScaleRef.current) <= 0.002) {
      return;
    }

    overlayScaleRef.current = labelScale;
    const attr = `scale(${labelScale.toFixed(5)})`;
    plane.querySelectorAll("[data-overlay-scale]").forEach((node) => {
      node.setAttribute("transform", attr);
    });
  }, [planeRef]);

  const applyHtmlTransform = useCallback(() => {
    const plane = planeRef.current;
    if (!plane) {
      return;
    }

    if (htmlScaleRef.current === 1 && htmlTxRef.current === 0 && htmlTyRef.current === 0) {
      plane.style.transform = "none";
      return;
    }

    plane.style.transform = `translate3d(${htmlTxRef.current}px, ${htmlTyRef.current}px, 0) scale(${htmlScaleRef.current})`;
  }, [planeRef]);

  /** 焼き込み済みのカメラを SVG の transform として描画し、画面解像度で再ラスタライズする */
  const applySvgCamera = useCallback(() => {
    const layer = worldLayerRef.current;
    if (!layer) {
      return;
    }

    const scale = bakedScaleRef.current;
    const ux = bakedUxRef.current;
    const uy = bakedUyRef.current;
    if (scale === 1 && ux === 0 && uy === 0) {
      layer.removeAttribute("transform");
      return;
    }

    layer.setAttribute(
      "transform",
      `translate(${CX + ux} ${CY + uy}) scale(${scale}) translate(${-CX} ${-CY})`,
    );
  }, [worldLayerRef]);

  /**
   * 指を離したあと、CSS で引き伸ばしたビットマップを捨てて
   * 同じ見え方を SVG のベクトル再描画に置き換える（ガビガビ解消）。
   */
  const bakeToSvg = useCallback(() => {
    cacheMetrics();
    const htmlScale = htmlScaleRef.current;
    const htmlTx = htmlTxRef.current;
    const htmlTy = htmlTyRef.current;
    if (htmlScale !== 1 || htmlTx !== 0 || htmlTy !== 0) {
      const fit = fitRef.current;
      bakedUxRef.current = htmlTx / fit + htmlScale * bakedUxRef.current;
      bakedUyRef.current = htmlTy / fit + htmlScale * bakedUyRef.current;
      bakedScaleRef.current *= htmlScale;
      htmlScaleRef.current = 1;
      htmlTxRef.current = 0;
      htmlTyRef.current = 0;
    }

    const plane = planeRef.current;
    if (plane) {
      // 拡大された合成テクスチャを破棄して、新しい SVG 描画を拾わせる
      plane.style.willChange = "auto";
      plane.style.transform = "none";
    }

    applySvgCamera();
    applyLabels();

    if (plane) {
      void plane.offsetWidth;
    }
  }, [applyLabels, applySvgCamera, cacheMetrics, planeRef]);

  const stopLoop = useCallback(() => {
    if (rafRef.current != null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const emitIdle = useCallback(() => {
    if (idleTimerRef.current != null) {
      window.clearTimeout(idleTimerRef.current);
    }

    idleTimerRef.current = window.setTimeout(() => {
      interactingRef.current = false;
      inertiaRef.current = false;
      tweenRef.current = null;
      const viewport = viewportRef.current;
      const plane = planeRef.current;
      if (viewport) {
        viewport.style.cursor = "grab";
      }
      bakeToSvg();
      if (plane) {
        plane.style.willChange = "auto";
      }
      callbacksRef.current.onViewIdle?.({
        zoom: logicalZoom(),
        offset: { x: bakedUxRef.current, y: bakedUyRef.current },
      });
    }, IDLE_MS);
  }, [bakeToSvg, planeRef, viewportRef]);

  const ensureLoop = useCallback(() => {
    if (rafRef.current != null) {
      return;
    }

    const step = (now: number) => {
      const tween = tweenRef.current;
      if (tween) {
        const progress = Math.min(1, (now - tween.start) / ZOOM_ANIM_MS);
        const eased = 1 - (1 - progress) ** 3;
        const scale =
          tween.fromScale * (tween.toScale / tween.fromScale) ** eased;
        htmlScaleRef.current = scale;
        htmlTxRef.current =
          tween.clientX - originRef.current.x - tween.localX * scale;
        htmlTyRef.current =
          tween.clientY - originRef.current.y - tween.localY * scale;
        dirtyRef.current = true;
        if (progress >= 1) {
          tweenRef.current = null;
          emitIdle();
        }
      } else if (inertiaRef.current) {
        const state = inertiaStateRef.current;
        const dt = Math.min(32, now - state.last);
        state.last = now;
        const decay = Math.exp(-FRICTION * dt);
        state.vx *= decay;
        state.vy *= decay;
        if (Math.hypot(state.vx, state.vy) < INERTIA_STOP) {
          inertiaRef.current = false;
          emitIdle();
        } else {
          htmlTxRef.current += state.vx * dt;
          htmlTyRef.current += state.vy * dt;
          dirtyRef.current = true;
        }
      }

      if (dirtyRef.current) {
        dirtyRef.current = false;
        applyHtmlTransform();
      }

      if (interactingRef.current || inertiaRef.current || tweenRef.current) {
        rafRef.current = window.requestAnimationFrame(step);
        return;
      }

      rafRef.current = null;
    };

    rafRef.current = window.requestAnimationFrame(step);
  }, [applyHtmlTransform, emitIdle]);

  const beginInteraction = useCallback(() => {
    interactingRef.current = true;
    inertiaRef.current = false;
    if (idleTimerRef.current != null) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }

    const viewport = viewportRef.current;
    const plane = planeRef.current;
    if (viewport) {
      viewport.style.cursor = "grabbing";
    }
    if (plane) {
      plane.style.willChange = "transform";
    }
    ensureLoop();
  }, [ensureLoop, planeRef, viewportRef]);

  const zoomAroundClient = useCallback(
    (clientX: number, clientY: number, nextLogical: number) => {
      const current = logicalZoom();
      const target = clampZoom(nextLogical);
      if (current === target) {
        return;
      }

      const nextHtml = target / bakedScaleRef.current;
      const { x: ox, y: oy } = originRef.current;
      const localX = (clientX - ox - htmlTxRef.current) / htmlScaleRef.current;
      const localY = (clientY - oy - htmlTyRef.current) / htmlScaleRef.current;
      htmlScaleRef.current = nextHtml;
      htmlTxRef.current = clientX - ox - localX * nextHtml;
      htmlTyRef.current = clientY - oy - localY * nextHtml;
      dirtyRef.current = true;
      ensureLoop();
    },
    [ensureLoop],
  );

  const animateZoomTo = useCallback(
    (clientX: number, clientY: number, targetLogical: number) => {
      cacheMetrics();
      const current = logicalZoom();
      const target = clampZoom(targetLogical);
      if (Math.abs(target - current) < 1e-4) {
        emitIdle();
        return;
      }

      const { x: ox, y: oy } = originRef.current;
      const fromHtml = htmlScaleRef.current;
      const toHtml = target / bakedScaleRef.current;
      beginInteraction();
      tweenRef.current = {
        start: performance.now(),
        fromScale: fromHtml,
        toScale: toHtml,
        localX: (clientX - ox - htmlTxRef.current) / fromHtml,
        localY: (clientY - oy - htmlTyRef.current) / fromHtml,
        clientX,
        clientY,
      };
      ensureLoop();
    },
    [beginInteraction, cacheMetrics, emitIdle, ensureLoop],
  );

  useEffect(() => {
    cacheMetrics();
    applyHtmlTransform();
    applySvgCamera();
    applyLabels();
  }, [applyHtmlTransform, applyLabels, applySvgCamera, cacheMetrics]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const sampleVelocity = (
      clientX: number,
      clientY: number,
      timeStamp: number,
    ) => {
      const last = lastSampleRef.current;
      if (last && timeStamp > last.t) {
        const dt = timeStamp - last.t;
        if (dt > 0) {
          velocityRef.current = {
            x: (clientX - last.x) / dt,
            y: (clientY - last.y) / dt,
          };
        }
      }
      lastSampleRef.current = { x: clientX, y: clientY, t: timeStamp };
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      cacheMetrics();
      tweenRef.current = null;
      beginInteraction();
      const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
      const intensity = event.ctrlKey ? 0.02 : 0.0018;
      zoomAroundClient(
        event.clientX,
        event.clientY,
        logicalZoom() * Math.exp(-delta * intensity),
      );
      emitIdle();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      tweenRef.current = null;
      inertiaRef.current = false;
      cacheMetrics();
      beginInteraction();

      downRef.current = { x: event.clientX, y: event.clientY };
      pointersRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
      movedRef.current = false;
      callbacksRef.current.onSuppressClickChange?.(false);
      lastSampleRef.current = {
        x: event.clientX,
        y: event.clientY,
        t: event.timeStamp,
      };
      velocityRef.current = { x: 0, y: 0 };

      if (pointersRef.current.size === 1) {
        panRef.current = {
          x: event.clientX,
          y: event.clientY,
          tx: htmlTxRef.current,
          ty: htmlTyRef.current,
        };
        pinchRef.current = null;
        return;
      }

      multiTouchRef.current = true;
      const points = [...pointersRef.current.values()];
      if (points.length < 2) {
        return;
      }

      const [a, b] = points;
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const htmlScale = htmlScaleRef.current;
      const { x: ox, y: oy } = originRef.current;

      if (distance > 0) {
        pinchRef.current = {
          distance,
          htmlScale,
          localX: (midX - ox - htmlTxRef.current) / htmlScale,
          localY: (midY - oy - htmlTyRef.current) / htmlScale,
        };
      }

      if (pointersRef.current.size === 2) {
        twoFingerTapRef.current = {
          time: event.timeStamp,
          x: midX,
          y: midY,
          valid: true,
          handled: false,
        };
      } else if (twoFingerTapRef.current) {
        twoFingerTapRef.current.valid = false;
      }

      panRef.current = null;

      for (const pointerId of pointersRef.current.keys()) {
        try {
          viewport.setPointerCapture(pointerId);
        } catch {
          // キャプチャできない環境でも window の pointermove で追従する
        }
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!pointersRef.current.has(event.pointerId)) {
        return;
      }

      pointersRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
      sampleVelocity(event.clientX, event.clientY, event.timeStamp);

      if (
        !movedRef.current &&
        Math.hypot(
          event.clientX - downRef.current.x,
          event.clientY - downRef.current.y,
        ) > DRAG_THRESHOLD_PX
      ) {
        movedRef.current = true;
        callbacksRef.current.onSuppressClickChange?.(true);
        try {
          viewport.setPointerCapture(event.pointerId);
        } catch {
          // ignore
        }
        if (twoFingerTapRef.current) {
          twoFingerTapRef.current.valid = false;
        }
        tweenRef.current = null;
        if (pointersRef.current.size === 1) {
          panRef.current = {
            x: event.clientX,
            y: event.clientY,
            tx: htmlTxRef.current,
            ty: htmlTyRef.current,
          };
        }
      }

      if (pointersRef.current.size >= 2 && pinchRef.current) {
        const [a, b] = [...pointersRef.current.values()];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (distance <= 0) {
          return;
        }

        const ratio = distance / pinchRef.current.distance;
        if (twoFingerTapRef.current && Math.abs(ratio - 1) > PINCH_TOLERANCE) {
          twoFingerTapRef.current.valid = false;
        }

        const nextLogical = clampZoom(
          bakedScaleRef.current * pinchRef.current.htmlScale * ratio,
        );
        const htmlScale = nextLogical / bakedScaleRef.current;
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;
        const { x: ox, y: oy } = originRef.current;
        htmlScaleRef.current = htmlScale;
        htmlTxRef.current = midX - ox - pinchRef.current.localX * htmlScale;
        htmlTyRef.current = midY - oy - pinchRef.current.localY * htmlScale;
        dirtyRef.current = true;
        ensureLoop();
        return;
      }

      if (pointersRef.current.size !== 1 || !panRef.current) {
        return;
      }

      htmlTxRef.current = panRef.current.tx + (event.clientX - panRef.current.x);
      htmlTyRef.current = panRef.current.ty + (event.clientY - panRef.current.y);
      dirtyRef.current = true;
      ensureLoop();
    };

    const endPointer = (event: PointerEvent) => {
      if (!pointersRef.current.has(event.pointerId)) {
        return;
      }

      pointersRef.current.delete(event.pointerId);
      if (viewport.hasPointerCapture(event.pointerId)) {
        viewport.releasePointerCapture(event.pointerId);
      }

      const now = event.timeStamp;
      const twoFinger = twoFingerTapRef.current;
      if (
        twoFinger &&
        twoFinger.valid &&
        !twoFinger.handled &&
        !movedRef.current &&
        now - twoFinger.time <= TWO_FINGER_TAP_MS
      ) {
        twoFinger.handled = true;
        lastTapRef.current = null;
        callbacksRef.current.onSuppressClickChange?.(true);
        callbacksRef.current.onTapZoom?.();
        animateZoomTo(
          twoFinger.x,
          twoFinger.y,
          logicalZoom() / TAP_ZOOM_STEP,
        );
      }

      if (pointersRef.current.size === 1) {
        const remaining = [...pointersRef.current.values()][0];
        panRef.current = {
          x: remaining.x,
          y: remaining.y,
          tx: htmlTxRef.current,
          ty: htmlTyRef.current,
        };
        pinchRef.current = null;
        return;
      }

      if (pointersRef.current.size > 0) {
        return;
      }

      const wasMultiTouch = multiTouchRef.current;
      panRef.current = null;
      pinchRef.current = null;
      twoFingerTapRef.current = null;
      multiTouchRef.current = false;

      if (wasMultiTouch) {
        emitIdle();
        return;
      }

      if (!movedRef.current) {
        const previousTap = lastTapRef.current;
        const isDoubleTap =
          previousTap != null &&
          now - previousTap.t <= DOUBLE_TAP_MS &&
          Math.hypot(
            event.clientX - previousTap.x,
            event.clientY - previousTap.y,
          ) <= TAP_SLOP_PX;

        if (isDoubleTap) {
          lastTapRef.current = null;
          callbacksRef.current.onSuppressClickChange?.(true);
          callbacksRef.current.onTapZoom?.();
          animateZoomTo(
            event.clientX,
            event.clientY,
            logicalZoom() * TAP_ZOOM_STEP,
          );
          return;
        }

        lastTapRef.current = { t: now, x: event.clientX, y: event.clientY };
        emitIdle();
        return;
      }

      const speed = Math.hypot(velocityRef.current.x, velocityRef.current.y);
      if (speed > INERTIA_START) {
        inertiaStateRef.current = {
          last: performance.now(),
          vx: velocityRef.current.x,
          vy: velocityRef.current.y,
        };
        inertiaRef.current = true;
        interactingRef.current = false;
        ensureLoop();
        return;
      }

      emitIdle();
    };

    const preventNativeGesture = (event: Event) => event.preventDefault();
    const onResize = () => {
      cacheMetrics();
      applySvgCamera();
    };

    viewport.addEventListener("wheel", onWheel, { passive: false });
    viewport.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", endPointer, { passive: true });
    window.addEventListener("pointercancel", endPointer, { passive: true });
    viewport.addEventListener("gesturestart", preventNativeGesture);
    viewport.addEventListener("gesturechange", preventNativeGesture);
    viewport.addEventListener("gestureend", preventNativeGesture);
    viewport.addEventListener("dblclick", preventNativeGesture);
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("scroll", onResize);

    return () => {
      viewport.removeEventListener("wheel", onWheel);
      viewport.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", endPointer);
      window.removeEventListener("pointercancel", endPointer);
      viewport.removeEventListener("gesturestart", preventNativeGesture);
      viewport.removeEventListener("gesturechange", preventNativeGesture);
      viewport.removeEventListener("gestureend", preventNativeGesture);
      viewport.removeEventListener("dblclick", preventNativeGesture);
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("scroll", onResize);
      stopLoop();
      if (idleTimerRef.current != null) {
        window.clearTimeout(idleTimerRef.current);
      }
    };
  }, [
    animateZoomTo,
    applySvgCamera,
    beginInteraction,
    cacheMetrics,
    emitIdle,
    ensureLoop,
    stopLoop,
    viewportRef,
    zoomAroundClient,
  ]);

  const zoomIn = useCallback(() => {
    cacheMetrics();
    const { x, y } = originRef.current;
    animateZoomTo(x, y, logicalZoom() * BUTTON_ZOOM_STEP);
  }, [animateZoomTo, cacheMetrics]);

  const zoomOut = useCallback(() => {
    cacheMetrics();
    const { x, y } = originRef.current;
    animateZoomTo(x, y, logicalZoom() / BUTTON_ZOOM_STEP);
  }, [animateZoomTo, cacheMetrics]);

  const resetView = useCallback(() => {
    tweenRef.current = null;
    inertiaRef.current = false;
    htmlScaleRef.current = 1;
    htmlTxRef.current = 0;
    htmlTyRef.current = 0;
    bakedScaleRef.current = 1;
    bakedUxRef.current = 0;
    bakedUyRef.current = 0;
    overlayScaleRef.current = 0;
    applyHtmlTransform();
    applySvgCamera();
    applyLabels();
    emitIdle();
  }, [applyHtmlTransform, applyLabels, applySvgCamera, emitIdle]);

  const refreshOverlayScale = useCallback(() => {
    overlayScaleRef.current = 0;
    applySvgCamera();
    applyLabels();
  }, [applyLabels, applySvgCamera]);

  return { zoomIn, zoomOut, resetView, refreshOverlayScale };
}
