import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 15에서는 turbopack이 기본적으로 활성화됨
  experimental: {
    // turbopack 관련 설정은 제거
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
