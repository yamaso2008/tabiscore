export type CityRegion =
  | "japan"
  | "northAmerica"
  | "asia"
  | "europe"
  | "oceania"
  | "middleEastAfrica"
  | "latinAmerica";

export interface MajorCity {
  id: string;
  nameJa: string;
  nameEn: string;
  lon: number;
  lat: number;
  region: CityRegion;
  labelX?: number;
  labelY?: number;
  anchor?: "start" | "end";
}

function city(
  id: string,
  nameJa: string,
  nameEn: string,
  lon: number,
  lat: number,
  region: CityRegion,
  labelX = 6,
  labelY = 3,
  anchor: "start" | "end" = "start",
): MajorCity {
  return { id, nameJa, nameEn, lon, lat, region, labelX, labelY, anchor };
}

export const MAJOR_CITIES: MajorCity[] = [
  // 日本
  city("tokyo", "東京", "Tokyo", 139.6917, 35.6895, "japan", 6, -7),
  city("osaka", "大阪", "Osaka", 135.5023, 34.6937, "japan", -6, 11, "end"),
  city("kyoto", "京都", "Kyoto", 135.7681, 35.0116, "japan", 6, -8),
  city("sapporo", "札幌", "Sapporo", 141.3545, 43.0618, "japan", 6, -6),
  city("fukuoka", "福岡", "Fukuoka", 130.4017, 33.5904, "japan", -6, 4, "end"),
  city("naha", "那覇", "Naha", 127.6792, 26.2124, "japan", 6, 10),

  // 北米
  city("new-york", "ニューヨーク", "New York", -74.006, 40.7128, "northAmerica", 6, 4),
  city("los-angeles", "ロサンゼルス", "Los Angeles", -118.2437, 34.0522, "northAmerica", 6, 11),
  city("san-francisco", "サンフランシスコ", "San Francisco", -122.4194, 37.7749, "northAmerica", 6, -8),
  city("chicago", "シカゴ", "Chicago", -87.6298, 41.8781, "northAmerica", 6, -8),
  city("dallas", "ダラス", "Dallas", -96.797, 32.7767, "northAmerica", 6, -8),
  city("houston", "ヒューストン", "Houston", -95.3698, 29.7604, "northAmerica", 6, 11),
  city("seattle", "シアトル", "Seattle", -122.3321, 47.6062, "northAmerica", 6, -8),
  city("miami", "マイアミ", "Miami", -80.1918, 25.7617, "northAmerica", 6, 11),
  city("toronto", "トロント", "Toronto", -79.3832, 43.6532, "northAmerica", 6, -10),
  city("vancouver", "バンクーバー", "Vancouver", -123.1207, 49.2827, "northAmerica", 6, -8),
  city("mexico-city", "メキシコシティ", "Mexico City", -99.1332, 19.4326, "northAmerica", 6, 4),

  // アジア
  city("taipei", "台北", "Taipei", 121.5654, 25.033, "asia", 6, -8),
  city("kaohsiung", "高雄", "Kaohsiung", 120.3014, 22.6273, "asia", 6, 11),
  city("seoul", "ソウル", "Seoul", 126.978, 37.5665, "asia", -6, -7, "end"),
  city("busan", "釜山", "Busan", 129.0756, 35.1796, "asia", 6, 11),
  city("beijing", "北京", "Beijing", 116.4074, 39.9042, "asia", 6, -10),
  city("shanghai", "上海", "Shanghai", 121.4737, 31.2304, "asia", 6, 4),
  city("hong-kong", "香港", "Hong Kong", 114.1694, 22.3193, "asia", 6, 4),
  city("guangzhou", "広州", "Guangzhou", 113.2644, 23.1291, "asia", -6, -8, "end"),
  city("singapore", "シンガポール", "Singapore", 103.8198, 1.3521, "asia", 6, 10),
  city("bangkok", "バンコク", "Bangkok", 100.5018, 13.7563, "asia", 6, -8),
  city("kuala-lumpur", "クアラルンプール", "Kuala Lumpur", 101.6869, 3.139, "asia", 6, -6),
  city("jakarta", "ジャカルタ", "Jakarta", 106.8456, -6.2088, "asia", 6, 10),
  city("manila", "マニラ", "Manila", 120.9842, 14.5995, "asia", 6, 4),
  city("hanoi", "ハノイ", "Hanoi", 105.8342, 21.0278, "asia", 6, -8),
  city("ho-chi-minh", "ホーチミン", "Ho Chi Minh", 106.6297, 10.8231, "asia", 6, 11),
  city("new-delhi", "ニューデリー", "New Delhi", 77.209, 28.6139, "asia", 6, -8),
  city("mumbai", "ムンバイ", "Mumbai", 72.8777, 19.076, "asia", 6, 10),

  // ヨーロッパ
  city("london", "ロンドン", "London", -0.1276, 51.5074, "europe", -6, -8, "end"),
  city("paris", "パリ", "Paris", 2.3522, 48.8566, "europe", -6, 11, "end"),
  city("amsterdam", "アムステルダム", "Amsterdam", 4.9041, 52.3676, "europe", 6, -8),
  city("berlin", "ベルリン", "Berlin", 13.405, 52.52, "europe", 6, -8),
  city("frankfurt", "フランクフルト", "Frankfurt", 8.6821, 50.1109, "europe", 6, 11),
  city("zurich", "チューリッヒ", "Zurich", 8.5417, 47.3769, "europe", -6, 4, "end"),
  city("vienna", "ウィーン", "Vienna", 16.3738, 48.2082, "europe", 6, 4),
  city("milan", "ミラノ", "Milan", 9.19, 45.4642, "europe", -6, 11, "end"),
  city("rome", "ローマ", "Rome", 12.4964, 41.9028, "europe", 6, 11),
  city("madrid", "マドリード", "Madrid", -3.7038, 40.4168, "europe", -6, 4, "end"),
  city("barcelona", "バルセロナ", "Barcelona", 2.1734, 41.3851, "europe", 6, 11),
  city("istanbul", "イスタンブール", "Istanbul", 28.9784, 41.0082, "europe", 6, 4),

  // オセアニア
  city("sydney", "シドニー", "Sydney", 151.2093, -33.8688, "oceania", 6, -8),
  city("melbourne", "メルボルン", "Melbourne", 144.9631, -37.8136, "oceania", -6, 11, "end"),
  city("brisbane", "ブリスベン", "Brisbane", 153.0251, -27.4698, "oceania", 6, -8),
  city("perth", "パース", "Perth", 115.8605, -31.9505, "oceania", 6, 4),
  city("auckland", "オークランド", "Auckland", 174.7633, -36.8485, "oceania", 6, 4),

  // 中東・アフリカ
  city("dubai", "ドバイ", "Dubai", 55.2708, 25.2048, "middleEastAfrica", 6, -8),
  city("abu-dhabi", "アブダビ", "Abu Dhabi", 54.3773, 24.4539, "middleEastAfrica", 6, 11),
  city("doha", "ドーハ", "Doha", 51.531, 25.2854, "middleEastAfrica", -6, 4, "end"),
  city("riyadh", "リヤド", "Riyadh", 46.6753, 24.7136, "middleEastAfrica", -6, 4, "end"),
  city("cairo", "カイロ", "Cairo", 31.2357, 30.0444, "middleEastAfrica", 6, 4),
  city("johannesburg", "ヨハネスブルグ", "Johannesburg", 28.0473, -26.2041, "middleEastAfrica", 6, -8),
  city("cape-town", "ケープタウン", "Cape Town", 18.4241, -33.9249, "middleEastAfrica", 6, 4),

  // 中南米
  city("buenos-aires", "ブエノスアイレス", "Buenos Aires", -58.3816, -34.6037, "latinAmerica", 6, 4),
  city("sao-paulo", "サンパウロ", "São Paulo", -46.6333, -23.5505, "latinAmerica", 6, 11),
  city("rio", "リオデジャネイロ", "Rio de Janeiro", -43.1729, -22.9068, "latinAmerica", 6, -8),
  city("santiago", "サンティアゴ", "Santiago", -70.6693, -33.4489, "latinAmerica", 6, 4),
  city("lima", "リマ", "Lima", -77.0428, -12.0464, "latinAmerica", 6, 4),
  city("bogota", "ボゴタ", "Bogotá", -74.0721, 4.711, "latinAmerica", 6, 4),
];
