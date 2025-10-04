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
  outputFileTracingRoot: '/Users/seochunwoo/Documents/50se/smart on',
};

export default nextConfig;
