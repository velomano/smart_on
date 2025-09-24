const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

// pnpm/모노레포에서 심볼릭 링크 해석
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_conditionNames = ['require','react-native','browser','import'];

// HMRClient 스텁 설정
config.resolver.alias = {
  ...(config.resolver.alias || {}),
  '@expo/metro/metro-runtime/modules/HMRClient': require.resolve(
    'metro-runtime/src/modules/empty-module.js'
  ),
};

module.exports = config;
