"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import { MAP_HEIGHT, MAP_WIDTH } from "@/lib/map-styles";

const MIN_ZOOM = 1;
const MAX_ZOOM = 24;
const CX = MAP_WIDTH / 2;
const CY = MAP_HEIGHT / 2;
const DRAG_THRESHOLD_PX = 4;
const DOUBLE_TAP_MS = 280;
const IDLE_MS = 140;
const INERTIA_STOP = 0.04;
const INERTIA_START = 0.32;
const FRICTION = 0.0032;

export interface MapView {
  zoom: number;
  offset: { x: number; y: number };
}

interface UseMapGesturesOptions {
  svgRef: RefObject<SVGSVGElement | null>;
  worldLayerRef: RefObject<SVGGElement | null>;
  onViewIdle?: (view: MapView) => void;
  onSuppressClickChange?: (suppress: boolean) => void;
}

function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

function clientToSvg(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } | null {
  const ctm = svg.getScreenCTM();
  if (!ctm) {
    return null;
  }

  const point = svg.createSVGPoint();
  point.x = clientX;
  point.y = clientY;
  const mapped = point.matrixTransform(ctm.inverse());
  return { x: mapped.x, y: mapped.y };
}

export function useMapGestures({
  svgRef,
  worldLayerRef,
  onViewIdle,
  onSuppressClickChange,
}: UseMapGesturesOptions) {
  const zoomRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const inertiaRafRef = useRef<number | null>(null);
  const idleTimerRef = useRef<number | null>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const panStartRef = useRef<{
    svgX: number;
    svgY: number;
    ox: number;
    oy: number;
  } | null>(null);
  const pinchRef = useRef<{
    mapX: number;
    mapY: number;
    distance: number;
    zoom: number;
  } | null>(null);
  const downClientRef = useRef({ x: 0, y: 0 });
  const movedRef = useRef(false);
  const lastSampleRef = useRef<{ x: number; y: number; t: number } | null>(
    null,
  );
  const velocityRef = useRef({ x: 0, y: 0 });
  const lastTapRef = useRef<{ t: number; x: number; y: number } | null>(null);

  const applyTransform = useCallback(() => {
    const layer = worldLayerRef.current;
    if (!layer) {
      return;
    }

    const zoom = zoomRef.current;
    const { x, y } = offsetRef.current;
    layer.style.transform = `translate3d(${x * zoom}px, ${y * zoom}px, 0) scale(${zoom})`;
  }, [worldLayerRef]);

  const scheduleTransform = useCallback(() => {
    if (rafRef.current != null) {
      return;
    }

    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      applyTransform();
    });
  }, [applyTransform]);

  const setInteracting = useCallback(
    (value: boolean) => {
      const layer = worldLayerRef.current;
      const svg = svgRef.current;
      if (layer) {
        layer.style.willChange = value ? "transform" : "auto";
        layer.style.pointerEvents = value ? "none" : "auto";
      }
      if (svg) {
        svg.style.cursor = value ? "grabbing" : "grab";
      }
    },
    [svgRef, worldLayerRef],
  );

  const emitIdle = useCallback(() => {
    if (idleTimerRef.current != null) {
      window.clearTimeout(idleTimerRef.current);
    }

    idleTimerRef.current = window.setTimeout(() => {
      setInteracting(false);
      onViewIdle?.({
        zoom: zoomRef.current,
        offset: { ...offsetRef.current },
      });
    }, IDLE_MS);
  }, [onViewIdle, setInteracting]);

  const stopInertia = useCallback(() => {
    if (inertiaRafRef.current != null) {
      window.cancelAnimationFrame(inertiaRafRef.current);
      inertiaRafRef.current = null;
    }
  }, []);

  const zoomAroundSvg = useCallback(
    (svgX: number, svgY: number, nextZoom: number) => {
      const z0 = zoomRef.current;
      const z1 = clampZoom(nextZoom);
      if (z0 === z1) {
        return;
      }

      const { x: ox, y: oy } = offsetRef.current;
      offsetRef.current = {
        x: ox + (svgX - CX) * (1 / z1 - 1 / z0),
        y: oy + (svgY - CY) * (1 / z1 - 1 / z0),
      };
      zoomRef.current = z1;
      scheduleTransform();
    },
    [scheduleTransform],
  );

  const startInertia = useCallback(() => {
    stopInertia();
    let last = performance.now();
    let vx = velocityRef.current.x;
    let vy = velocityRef.current.y;

    const step = (now: number) => {
      const dt = Math.min(32, now - last);
      last = now;
      const decay = Math.exp(-FRICTION * dt);
      vx *= decay;
      vy *= decay;

      if (Math.hypot(vx, vy) < INERTIA_STOP) {
        inertiaRafRef.current = null;
        emitIdle();
        return;
      }

      const z = zoomRef.current;
      offsetRef.current = {
        x: offsetRef.current.x + (vx * dt) / z,
        y: offsetRef.current.y + (vy * dt) / z,
      };
      scheduleTransform();
      inertiaRafRef.current = window.requestAnimationFrame(step);
    };

    inertiaRafRef.current = window.requestAnimationFrame(step);
  }, [emitIdle, scheduleTransform, stopInertia]);

  useEffect(() => {
    applyTransform();
  }, [applyTransform]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) {
      return;
    }

    const onWheel = (event: WheelEvent) => {
      const point = clientToSvg(svg, event.clientX, event.clientY);
      if (!point) {
        return;
      }

      stopInertia();
      setInteracting(true);
      zoomAroundSvg(
        point.x,
        point.y,
        zoomRef.current * (event.deltaY < 0 ? 1.08 : 1 / 1.08),
      );
      emitIdle();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      stopInertia();
      downClientRef.current = { x: event.clientX, y: event.clientY };
      pointersRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
      movedRef.current = false;
      onSuppressClickChange?.(false);
      lastSampleRef.current = {
        x: event.clientX,
        y: event.clientY,
        t: event.timeStamp,
      };
      velocityRef.current = { x: 0, y: 0 };

      if (pointersRef.current.size === 1) {
        const point = clientToSvg(svg, event.clientX, event.clientY);
        if (point) {
          panStartRef.current = {
            svgX: point.x,
            svgY: point.y,
            ox: offsetRef.current.x,
            oy: offsetRef.current.y,
          };
        }
        pinchRef.current = null;
        return;
      }

      const points = [...pointersRef.current.values()];
      if (points.length < 2) {
        return;
      }

      const [a, b] = points;
      const mid = clientToSvg(svg, (a.x + b.x) / 2, (a.y + b.y) / 2);
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (mid && distance > 0) {
        const z = zoomRef.current;
        pinchRef.current = {
          distance,
          zoom: z,
          mapX: (mid.x - CX) / z + CX - offsetRef.current.x,
          mapY: (mid.y - CY) / z + CY - offsetRef.current.y,
        };
      }
      panStartRef.current = null;
      setInteracting(true);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!pointersRef.current.has(event.pointerId)) {
        return;
      }

      pointersRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });

      const last = lastSampleRef.current;
      if (last && event.timeStamp > last.t) {
        const prev = clientToSvg(svg, last.x, last.y);
        const next = clientToSvg(svg, event.clientX, event.clientY);
        const dt = event.timeStamp - last.t;
        if (prev && next && dt > 0) {
          velocityRef.current = {
            x: (next.x - prev.x) / dt,
            y: (next.y - prev.y) / dt,
          };
        }
      }
      lastSampleRef.current = {
        x: event.clientX,
        y: event.clientY,
        t: event.timeStamp,
      };

      if (
        Math.hypot(
          event.clientX - downClientRef.current.x,
          event.clientY - downClientRef.current.y,
        ) > DRAG_THRESHOLD_PX &&
        !movedRef.current
      ) {
        movedRef.current = true;
        setInteracting(true);
        onSuppressClickChange?.(true);
      }

      if (pointersRef.current.size >= 2 && pinchRef.current) {
        const [a, b] = [...pointersRef.current.values()];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        const mid = clientToSvg(svg, (a.x + b.x) / 2, (a.y + b.y) / 2);
        if (!mid || distance <= 0) {
          return;
        }

        const z = clampZoom(
          pinchRef.current.zoom * (distance / pinchRef.current.distance),
        );
        zoomRef.current = z;
        offsetRef.current = {
          x: (mid.x - CX) / z + CX - pinchRef.current.mapX,
          y: (mid.y - CY) / z + CY - pinchRef.current.mapY,
        };
        scheduleTransform();
        return;
      }

      if (pointersRef.current.size !== 1 || !panStartRef.current) {
        return;
      }

      const point = clientToSvg(svg, event.clientX, event.clientY);
      if (!point) {
        return;
      }

      const z = zoomRef.current;
      offsetRef.current = {
        x: panStartRef.current.ox + (point.x - panStartRef.current.svgX) / z,
        y: panStartRef.current.oy + (point.y - panStartRef.current.svgY) / z,
      };
      scheduleTransform();
    };

    const endPointer = (event: PointerEvent) => {
      if (!pointersRef.current.has(event.pointerId)) {
        return;
      }

      pointersRef.current.delete(event.pointerId);

      if (pointersRef.current.size === 1) {
        const remaining = [...pointersRef.current.values()][0];
        const point = clientToSvg(svg, remaining.x, remaining.y);
        if (point) {
          panStartRef.current = {
            svgX: point.x,
            svgY: point.y,
            ox: offsetRef.current.x,
            oy: offsetRef.current.y,
          };
        }
        pinchRef.current = null;
        return;
      }

      if (pointersRef.current.size > 0) {
        return;
      }

      panStartRef.current = null;
      pinchRef.current = null;

      const now = event.timeStamp;
      if (!movedRef.current) {
        const prev = lastTapRef.current;
        if (
          prev &&
          now - prev.t <= DOUBLE_TAP_MS &&
          Math.hypot(event.clientX - prev.x, event.clientY - prev.y) <= 28
        ) {
          const point = clientToSvg(svg, event.clientX, event.clientY);
          if (point) {
            setInteracting(true);
            onSuppressClickChange?.(true);
            zoomAroundSvg(point.x, point.y, zoomRef.current * 2);
          }
          lastTapRef.current = null;
          emitIdle();
          return;
        }

        lastTapRef.current = { t: now, x: event.clientX, y: event.clientY };
        emitIdle();
        return;
      }

      if (Math.hypot(velocityRef.current.x, velocityRef.current.y) > INERTIA_START) {
        startInertia();
        return;
      }

      emitIdle();
    };

    const noopTouch = () => undefined;

    svg.addEventListener("wheel", onWheel, { passive: true });
    svg.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", endPointer, { passive: true });
    window.addEventListener("pointercancel", endPointer, { passive: true });
    svg.addEventListener("touchstart", noopTouch, { passive: true });
    svg.addEventListener("touchmove", noopTouch, { passive: true });

    return () => {
      svg.removeEventListener("wheel", onWheel);
      svg.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", endPointer);
      window.removeEventListener("pointercancel", endPointer);
      svg.removeEventListener("touchstart", noopTouch);
      svg.removeEventListener("touchmove", noopTouch);
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
      }
      stopInertia();
      if (idleTimerRef.current != null) {
        window.clearTimeout(idleTimerRef.current);
      }
    };
  }, [
    emitIdle,
    onSuppressClickChange,
    scheduleTransform,
    setInteracting,
    startInertia,
    stopInertia,
    svgRef,
    zoomAroundSvg,
  ]);

  const zoomBy = useCallback(
    (factor: number) => {
      stopInertia();
      setInteracting(true);
      zoomAroundSvg(CX, CY, zoomRef.current * factor);
      emitIdle();
    },
    [emitIdle, setInteracting, stopInertia, zoomAroundSvg],
  );

  const resetView = useCallback(() => {
    stopInertia();
    zoomRef.current = 1;
    offsetRef.current = { x: 0, y: 0 };
    applyTransform();
    emitIdle();
  }, [applyTransform, emitIdle, stopInertia]);

  return {
    zoomIn: () => zoomBy(1.4),
    zoomOut: () => zoomBy(1 / 1.4),
    resetView,
  };
}
