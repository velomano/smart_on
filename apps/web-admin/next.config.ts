import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 모노레포 패키지 트랜스파일 설정
  transpilePackages: ['iot-templates', '@smart-on/core'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
