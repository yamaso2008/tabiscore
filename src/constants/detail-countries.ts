export type DetailCountryCode = "USA" | "JPN" | "CHN";

export interface DetailCountryConfig {
  code: DetailCountryCode;
  name: string;
  regionLabel: string;
  geoUrl: string;
  projection: string;
  projectionConfig: Record<string, number | [number, number]>;
}

export const DETAIL_COUNTRY_CODES: DetailCountryCode[] = ["USA", "JPN", "CHN"];

export const DETAIL_COUNTRIES: Record<DetailCountryCode, DetailCountryConfig> = {
  USA: {
    code: "USA",
    name: "アメリカ",
    regionLabel: "州",
    geoUrl: "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json",
    projection: "geoAlbersUsa",
    projectionConfig: { scale: 1000 },
  },
  JPN: {
    code: "JPN",
    name: "日本",
    regionLabel: "都道府県",
    geoUrl:
      "https://cdn.jsdelivr.net/gh/dataofjapan/land@master/japan.geojson",
    projection: "geoMercator",
    projectionConfig: {
      scale: 1800,
      center: [138, 38],
    },
  },
  CHN: {
    code: "CHN",
    name: "中国",
    regionLabel: "省",
    geoUrl:
      "https://cdn.jsdelivr.net/gh/apache/echarts-website@asf-site/examples/data/asset/geo/china.json",
    projection: "geoMercator",
    projectionConfig: {
      scale: 700,
      center: [104, 35],
    },
  },
};

export function isDetailCountry(
  countryId: string,
): countryId is DetailCountryCode {
  return DETAIL_COUNTRY_CODES.includes(countryId as DetailCountryCode);
}

export function getRegionId(
  countryCode: DetailCountryCode,
  properties: Record<string, string>,
): string {
  switch (countryCode) {
    case "USA":
      return properties.name || properties.postal || "UNKNOWN";
    case "JPN":
      return properties.nam || properties.name || "UNKNOWN";
    case "CHN":
      return properties.name || properties.adcode || "UNKNOWN";
    default:
      return properties.name || "UNKNOWN";
  }
}

export function getRegionName(
  countryCode: DetailCountryCode,
  properties: Record<string, string>,
): string {
  return getRegionId(countryCode, properties);
}
