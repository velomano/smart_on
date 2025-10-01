import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 15에서는 turbopack이 기본적으로 활성화됨
  turbopack: {
    // 워크스페이스 루트 명시적으로 설정
    root: "../../",
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
