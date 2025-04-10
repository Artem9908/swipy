const { getDefaultConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// Customize as needed
defaultConfig.watchFolders = [__dirname];
defaultConfig.resolver.nodeModulesPaths = [__dirname + '/node_modules'];

module.exports = defaultConfig;