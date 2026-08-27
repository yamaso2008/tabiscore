import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // 実機（スマホ）から LAN 経由で開発サーバーを開けるようにする
  allowedDevOrigins: ["192.168.1.134", "*.local"],
};

export default nextConfig;
