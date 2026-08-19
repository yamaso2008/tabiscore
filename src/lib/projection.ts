import { geoNaturalEarth1, geoPath } from "d3-geo";
import type { GeoPath, GeoPermissibleObjects, GeoProjection } from "d3-geo";
import { MAP_HEIGHT, MAP_WIDTH } from "@/lib/map-styles";

const PADDING = 8;

/** 地球全体がビューボックスに収まるよう fitExtent で拡大率と中心を決める */
export function createWorldProjection(): GeoProjection {
  return geoNaturalEarth1()
    .rotate([-11, 0])
    .fitExtent(
      [
        [PADDING, PADDING],
        [MAP_WIDTH - PADDING, MAP_HEIGHT - PADDING],
      ],
      { type: "Sphere" },
    );
}

export function createPathGenerator(
  projection: GeoProjection,
): GeoPath<unknown, GeoPermissibleObjects> {
  return geoPath(projection);
}
