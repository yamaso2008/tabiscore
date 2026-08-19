import { normalizeProperties, propertyValue } from "@/lib/geography";

export type DetailCountryCode =
  | "USA"
  | "JPN"
  | "CHN"
  | "CAN"
  | "AUS"
  | "BRA"
  | "RUS"
  | "IND"
  | "GBR"
  | "FRA"
  | "DEU"
  | "ITA"
  | "ESP"
  | "KOR"
  | "TWN"
  | "IDN"
  | "MEX"
  | "ARG";

export interface DetailCountryConfig {
  code: DetailCountryCode;
  name: string;
  regionLabel: string;
  geoUrl: string;
}

export const DETAIL_COUNTRY_CODES: DetailCountryCode[] = [
  "USA",
  "JPN",
  "CHN",
  "CAN",
  "AUS",
  "BRA",
  "RUS",
  "IND",
  "GBR",
  "FRA",
  "DEU",
  "ITA",
  "ESP",
  "KOR",
  "TWN",
  "IDN",
  "MEX",
  "ARG",
];

export const DETAIL_COUNTRIES: Record<DetailCountryCode, DetailCountryConfig> = {
  USA: {
    code: "USA",
    name: "アメリカ",
    regionLabel: "州",
    geoUrl: "/data/usa-states.geojson",
  },
  JPN: {
    code: "JPN",
    name: "日本",
    regionLabel: "都道府県",
    geoUrl: "/data/japan-prefectures.geojson",
  },
  CHN: {
    code: "CHN",
    name: "中国",
    regionLabel: "省",
    geoUrl: "/data/china-provinces.geojson",
  },
  CAN: {
    code: "CAN",
    name: "カナダ",
    regionLabel: "州・準州",
    geoUrl: "/data/canada-provinces.geojson",
  },
  AUS: {
    code: "AUS",
    name: "オーストラリア",
    regionLabel: "州・準州",
    geoUrl: "/data/australia-states.geojson",
  },
  BRA: {
    code: "BRA",
    name: "ブラジル",
    regionLabel: "州",
    geoUrl: "/data/brazil-states.geojson",
  },
  RUS: {
    code: "RUS",
    name: "ロシア",
    regionLabel: "連邦構成主体",
    geoUrl: "/data/russia-subjects.geojson",
  },
  IND: {
    code: "IND",
    name: "インド",
    regionLabel: "州・連邦直轄領",
    geoUrl: "/data/india-states.geojson",
  },
  GBR: {
    code: "GBR",
    name: "イギリス",
    regionLabel: "構成国",
    geoUrl: "/data/uk-countries.geojson",
  },
  FRA: {
    code: "FRA",
    name: "フランス",
    regionLabel: "地域圏",
    geoUrl: "/data/france-regions.geojson",
  },
  DEU: {
    code: "DEU",
    name: "ドイツ",
    regionLabel: "州",
    geoUrl: "/data/germany-states.geojson",
  },
  ITA: {
    code: "ITA",
    name: "イタリア",
    regionLabel: "州",
    geoUrl: "/data/italy-regions.geojson",
  },
  ESP: {
    code: "ESP",
    name: "スペイン",
    regionLabel: "自治州",
    geoUrl: "/data/spain-communities.geojson",
  },
  KOR: {
    code: "KOR",
    name: "韓国",
    regionLabel: "道・広域市",
    geoUrl: "/data/korea-provinces.geojson",
  },
  TWN: {
    code: "TWN",
    name: "台湾",
    regionLabel: "県・市",
    geoUrl: "/data/taiwan-counties.geojson",
  },
  IDN: {
    code: "IDN",
    name: "インドネシア",
    regionLabel: "州",
    geoUrl: "/data/indonesia-provinces.geojson",
  },
  MEX: {
    code: "MEX",
    name: "メキシコ",
    regionLabel: "州",
    geoUrl: "/data/mexico-states.geojson",
  },
  ARG: {
    code: "ARG",
    name: "アルゼンチン",
    regionLabel: "州",
    geoUrl: "/data/argentina-provinces.geojson",
  },
};

export const REGION_GEO_URLS: Record<DetailCountryCode, string> =
  Object.fromEntries(
    DETAIL_COUNTRY_CODES.map((code) => [code, DETAIL_COUNTRIES[code].geoUrl]),
  ) as Record<DetailCountryCode, string>;

export const WORLD_GEO_URL = "/data/world-countries.geojson";

const DETAIL_COUNTRY_ALIASES: Record<DetailCountryCode, readonly string[]> = {
  USA: [
    "USA",
    "840",
    "US",
    "U.S.",
    "U.S.A.",
    "United States",
    "United States of America",
    "America",
    "アメリカ",
    "米国",
  ],
  JPN: [
    "JPN",
    "392",
    "JP",
    "Japan",
    "日本",
    "にほん",
    "ニホン",
  ],
  CHN: [
    "CHN",
    "156",
    "CN",
    "China",
    "People's Republic of China",
    "PRC",
    "中华人民共和国",
    "中国",
    "中華人民共和国",
  ],
  CAN: [
    "CAN",
    "124",
    "CA",
    "Canada",
    "カナダ",
  ],
  AUS: [
    "AUS",
    "036",
    "36",
    "AU",
    "Australia",
    "オーストラリア",
  ],
  BRA: [
    "BRA",
    "076",
    "76",
    "BR",
    "Brazil",
    "Brasil",
    "ブラジル",
  ],
  RUS: [
    "RUS",
    "643",
    "RU",
    "Russia",
    "Russian Federation",
    "ロシア",
    "ロシア連邦",
  ],
  IND: [
    "IND",
    "356",
    "IN",
    "India",
    "インド",
  ],
  GBR: [
    "GBR",
    "826",
    "GB",
    "UK",
    "United Kingdom",
    "Great Britain",
    "イギリス",
    "英国",
  ],
  FRA: [
    "FRA",
    "250",
    "FR",
    "France",
    "フランス",
  ],
  DEU: [
    "DEU",
    "276",
    "DE",
    "Germany",
    "ドイツ",
  ],
  ITA: [
    "ITA",
    "380",
    "IT",
    "Italy",
    "イタリア",
  ],
  ESP: [
    "ESP",
    "724",
    "ES",
    "Spain",
    "スペイン",
  ],
  KOR: [
    "KOR",
    "410",
    "KR",
    "South Korea",
    "Republic of Korea",
    "Korea, Republic of",
    "韓国",
    "大韓民国",
  ],
  TWN: [
    "TWN",
    "158",
    "TW",
    "Taiwan",
    "Taiwan, Province of China",
    "台湾",
    "台灣",
    "臺灣",
  ],
  IDN: [
    "IDN",
    "360",
    "ID",
    "Indonesia",
    "インドネシア",
  ],
  MEX: [
    "MEX",
    "484",
    "MX",
    "Mexico",
    "México",
    "メキシコ",
  ],
  ARG: [
    "ARG",
    "032",
    "32",
    "AR",
    "Argentina",
    "アルゼンチン",
  ],
};

const INVALID_ISO_CODES = new Set(["-99", "—", "-"]);

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

function matchDetailCountryCode(value: string): DetailCountryCode | null {
  const normalized = normalizeKey(value);

  for (const code of DETAIL_COUNTRY_CODES) {
    if (
      DETAIL_COUNTRY_ALIASES[code].some(
        (alias) => normalizeKey(alias) === normalized,
      )
    ) {
      return code;
    }
  }

  return null;
}

function getPropertyValues(
  properties: Record<string, unknown>,
): string[] {
  const normalized = normalizeProperties(properties);
  const keys = [
    "ISO_A3",
    "iso_a3",
    "ADM0_A3",
    "adm0_a3",
    "ISO_A2",
    "iso_a2",
    "ISO_N3",
    "iso_n3",
    "name",
    "NAME",
    "NAME_EN",
    "name_en",
    "ADMIN",
    "admin",
  ];

  return keys
    .map((key) => normalized[key])
    .filter((value) => Boolean(value && value.trim()));
}

function getValidIsoA3(properties: Record<string, unknown>): string | undefined {
  const normalized = normalizeProperties(properties);
  const iso = normalized.ISO_A3 || normalized.iso_a3 || normalized.ADM0_A3;

  if (!iso || INVALID_ISO_CODES.has(iso)) {
    return undefined;
  }

  return iso;
}

/** 国ID・国名・GeoJSON properties から詳細マップ対象国を判定 */
export function resolveDetailCountryCode(
  input: string | Record<string, unknown>,
): DetailCountryCode | null {
  if (typeof input === "string") {
    return matchDetailCountryCode(input);
  }

  for (const value of getPropertyValues(input)) {
    const matched = matchDetailCountryCode(value);
    if (matched) {
      return matched;
    }
  }

  return null;
}

export function isDetailCountry(
  countryId: string,
): countryId is DetailCountryCode {
  return resolveDetailCountryCode(countryId) !== null;
}

/** 世界地図で使う正規化された国ID（詳細対象国は USA/JPN/CHN に統一） */
export function getCanonicalCountryId(
  properties: Record<string, unknown> | null | undefined,
): string {
  const safeProperties = properties ?? {};
  const detailCode = resolveDetailCountryCode(safeProperties);
  if (detailCode) {
    return detailCode;
  }

  const normalized = normalizeProperties(safeProperties);
  return (
    getValidIsoA3(safeProperties) ||
    normalized.name ||
    normalized.NAME ||
    "UNKNOWN"
  );
}

export function getCountryName(
  properties: Record<string, unknown> | null | undefined,
): string {
  const normalized = normalizeProperties(properties);
  return (
    normalized.name ||
    normalized.NAME ||
    normalized.NAME_EN ||
    normalized.ADMIN ||
    "Unknown"
  );
}

const ISO_A3_TO_A2: Record<string, string> = {
  FRA: "FR",
  NOR: "NO",
  GBR: "GB",
  USA: "US",
  JPN: "JP",
  CHN: "CN",
  CAN: "CA",
  AUS: "AU",
  BRA: "BR",
  RUS: "RU",
  IND: "IN",
  DEU: "DE",
  ITA: "IT",
  ESP: "ES",
  KOR: "KR",
  TWN: "TW",
  IDN: "ID",
  MEX: "MX",
  ARG: "AR",
};

function intlRegionName(locale: "ja" | "en", isoA2: string, fallback: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(isoA2) ?? fallback;
  } catch {
    return fallback;
  }
}

export function getDetailCountryDisplayName(
  countryCode: DetailCountryCode | string,
  locale: "ja" | "en",
): string {
  const config = isDetailCountry(countryCode)
    ? DETAIL_COUNTRIES[countryCode]
    : undefined;

  if (locale === "ja") {
    return config?.name ?? countryCode;
  }

  const isoA2 = ISO_A3_TO_A2[countryCode];
  return isoA2 ? intlRegionName("en", isoA2, countryCode) : countryCode;
}

export function getLocalizedCountryName(
  properties: Record<string, unknown> | null | undefined,
  locale: "ja" | "en",
): string {
  const fallback = getCountryName(properties);
  const isoA2Raw = propertyValue(properties, "ISO_A2") || propertyValue(properties, "iso_a2");
  const isoA2 =
    (isoA2Raw.length === 2 && isoA2Raw !== "-99" ? isoA2Raw : "") ||
    ISO_A3_TO_A2[propertyValue(properties, "ADM0_A3")] ||
    ISO_A3_TO_A2[propertyValue(properties, "ISO_A3")] ||
    ISO_A3_TO_A2[getCanonicalCountryId(properties)];

  if (!isoA2) {
    return fallback;
  }

  return intlRegionName(locale, isoA2, fallback);
}

export function getLocalizedRegionName(
  countryCode: DetailCountryCode,
  properties: Record<string, unknown> | null | undefined,
  locale: "ja" | "en",
): string {
  const nameJa = propertyValue(properties, "name_ja") || propertyValue(properties, "nam_ja");
  const nameEn = propertyValue(properties, "name_en") || propertyValue(properties, "name");
  const nameZh =
    propertyValue(properties, "name_zh") ||
    propertyValue(properties, "name_simplified_chinese");
  const nameKo = propertyValue(properties, "name_ko");
  const regionId = getRegionId(countryCode, properties ?? {});

  if (locale === "ja") {
    if (nameJa) {
      return nameJa;
    }
    if (countryCode === "CHN" && nameZh) {
      return nameZh;
    }
    if (countryCode === "KOR" && nameKo) {
      return nameKo;
    }
    return nameEn || regionId || "UNKNOWN";
  }

  return nameEn || nameJa || regionId || "UNKNOWN";
}

export function getRegionId(
  countryCode: DetailCountryCode,
  properties: Record<string, unknown> | null | undefined,
): string {
  const normalized = normalizeProperties(properties);
  switch (countryCode) {
    case "USA":
      return normalized.name || normalized.postal || "UNKNOWN";
    case "JPN":
      return (
        normalized.name_ja ||
        normalized.nam_ja ||
        normalized.nam ||
        normalized.name ||
        "UNKNOWN"
      );
    case "CHN":
      return (
        normalized.name_zh ||
        (normalized.name_simplified_chinese ?? "").replace(/\s/g, "").trim() ||
        normalized.name ||
        normalized.adcode ||
        "UNKNOWN"
      );
    case "KOR":
      return normalized.name_ko || normalized.name || "UNKNOWN";
    default:
      return (
        normalized.name ||
        normalized.name_en ||
        normalized.postal ||
        "UNKNOWN"
      );
  }
}

export function getRegionName(
  countryCode: DetailCountryCode,
  properties: Record<string, unknown>,
): string {
  return getRegionId(countryCode, properties);
}
