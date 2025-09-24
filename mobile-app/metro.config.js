const { getDefaultConfig } = require('metro-config');
const path = require('path');
const fs = require('fs');

const config = getDefaultConfig(__dirname);

// React Native 0.72.15 호환 설정
// resolver 설정이 존재하는지 확인 후 설정
if (config.resolver) {
  // node_modules 경로 설정 (존재하는 경로만)
  const nodeModulesPaths = [
    path.resolve(__dirname, 'node_modules'),
    path.resolve(__dirname, '../node_modules'),
    path.resolve(__dirname, '../../node_modules'),
  ].filter(dir => fs.existsSync(dir));

  config.resolver.nodeModulesPaths = nodeModulesPaths;
}

// watchFolders 설정 (존재하는 경로만)
const watchFolders = [
  path.resolve(__dirname, '../node_modules'),
  path.resolve(__dirname, '../../node_modules'),
].filter(dir => fs.existsSync(dir));

config.watchFolders = watchFolders;

module.exports = config;
