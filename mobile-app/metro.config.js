// metro.config.js (Expo SDK 54)
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// pnpm / 모노레포에서 심볼릭 링크 해석
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_conditionNames = [
  'require',
  'react-native',
  'browser',
  'import',
];

// HMRClient 같은 네이티브 전용 모듈을 웹에서 비우기(스텁)
// 절대 경로 하드코딩 대신 require.resolve 로 크로스플랫폼 안전하게!
config.resolver.alias = {
  ...(config.resolver.alias || {}),
  '@expo/metro/metro-runtime/modules/HMRClient': require.resolve(
    'metro-runtime/src/modules/empty-module.js'
  ),
};

module.exports = config;
