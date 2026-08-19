import { geoArea } from "d3-geo";
import type {
  Feature,
  FeatureCollection,
  Geometry,
  Polygon,
  Position,
} from "geojson";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";

export type GeographyFeature = Feature<Geometry, Record<string, unknown>>;

const HALF_SPHERE_AREA = 2 * Math.PI;

function isPositionRing(value: unknown): value is Position[] {
  return Array.isArray(value) && value.length > 0;
}

function isPolygonRings(value: unknown): value is Position[][] {
  return Array.isArray(value);
}

function isInverted(rings: Position[][]): boolean {
  const exterior = rings[0];
  if (!isPositionRing(exterior)) {
    return false;
  }

  const polygon: Polygon = { type: "Polygon", coordinates: [exterior] };
  try {
    return geoArea(polygon) > HALF_SPHERE_AREA;
  } catch {
    return false;
  }
}

/**
 * d3-geo は球面ポリゴンの外周が時計回りであることを前提とする。
 * 反時計回り（RFC 7946 準拠）のデータはそのまま渡すと補集合（地球全体）として
 * 描画されるため、外周の向きを判定して反転させる。
 */
function rewindRings(rings: Position[][] | undefined | null): Position[][] {
  if (!isPolygonRings(rings) || rings.length === 0) {
    return [];
  }

  const validRings = rings.filter(isPositionRing);
  if (validRings.length === 0 || !isInverted(validRings)) {
    return validRings;
  }

  return validRings.map((ring) => [...ring].reverse());
}

function rewindGeometry(geometry: Geometry): Geometry | null {
  if (!geometry || !geometry.type) {
    return null;
  }

  if (geometry.type === "Polygon") {
    const coordinates = rewindRings(geometry.coordinates);
    if (coordinates.length === 0) {
      return null;
    }
    return { ...geometry, coordinates };
  }

  if (geometry.type === "MultiPolygon") {
    const polygons = Array.isArray(geometry.coordinates)
      ? geometry.coordinates
      : [];
    const coordinates = polygons
      .map((rings) => rewindRings(rings))
      .filter((rings) => rings.length > 0);

    if (coordinates.length === 0) {
      return null;
    }

    return { ...geometry, coordinates };
  }

  if (geometry.type === "GeometryCollection") {
    const geometries = (geometry.geometries ?? [])
      .map((item) => rewindGeometry(item))
      .filter((item): item is Geometry => Boolean(item));

    if (geometries.length === 0) {
      return null;
    }

    return { ...geometry, geometries };
  }

  return geometry;
}

export function rewindFeature(featureItem: GeographyFeature): GeographyFeature | null {
  if (!featureItem || featureItem.geometry == null) {
    return null;
  }

  const geometry = rewindGeometry(featureItem.geometry);
  if (!geometry) {
    return null;
  }

  return {
    ...featureItem,
    properties: featureItem.properties ?? {},
    geometry,
  };
}

export function normalizeProperties(
  properties: Record<string, unknown> | null | undefined,
): Record<string, string> {
  if (!properties) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(properties).map(([key, value]) => [
      key,
      value == null ? "" : String(value),
    ]),
  );
}

/** 欠損キーでも空文字を返し、`.length` 参照で落ちないようにする */
export function propertyValue(
  properties: Record<string, unknown> | null | undefined,
  key: string,
): string {
  return normalizeProperties(properties)[key] ?? "";
}

function isFeatureCollection(value: unknown): value is FeatureCollection {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as FeatureCollection).type === "FeatureCollection" &&
    Array.isArray((value as FeatureCollection).features)
  );
}

function isTopology(value: unknown): value is Topology {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as Topology).type === "Topology" &&
    typeof (value as Topology).objects === "object" &&
    (value as Topology).objects != null
  );
}

function rewindFeatureList(features: unknown): GeographyFeature[] {
  if (!Array.isArray(features)) {
    return [];
  }

  return features
    .filter((item): item is GeographyFeature => Boolean(item) && typeof item === "object")
    .map(rewindFeature)
    .filter((item): item is GeographyFeature => Boolean(item));
}

export function toFeatures(
  data: unknown,
  objectName?: string,
): GeographyFeature[] {
  if (isFeatureCollection(data)) {
    return rewindFeatureList(data.features);
  }

  if (!isTopology(data)) {
    throw new Error("地図データの形式が不正です");
  }

  const objectKeys = Object.keys(data.objects ?? {});
  const objectKey = objectName ?? objectKeys[0];
  const topoObject = objectKey ? data.objects[objectKey] : undefined;

  if (!topoObject) {
    throw new Error(`TopoJSON オブジェクト "${objectKey}" が見つかりません`);
  }

  const collection = feature(data, topoObject) as FeatureCollection | GeographyFeature;
  if (collection && collection.type === "FeatureCollection") {
    return rewindFeatureList(collection.features);
  }

  if (collection && collection.type === "Feature") {
    return rewindFeatureList([collection]);
  }

  return [];
}

export async function fetchFeatures(
  url: string,
  objectName?: string,
): Promise<GeographyFeature[]> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`取得に失敗しました (HTTP ${response.status})`);
  }

  const json: unknown = await response.json();
  return toFeatures(json, objectName);
}
