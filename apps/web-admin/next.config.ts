import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbopack: {
      root: '../../', // 모노레포 루트 경로
    },
  },
};

export default nextConfig;
