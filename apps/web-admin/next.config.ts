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
  // Vercel 배포를 위한 설정
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: undefined,
  },
};

export default nextConfig;
