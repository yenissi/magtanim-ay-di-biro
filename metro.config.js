const { getDefaultConfig } = require("@expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

// Get the default Expo Metro config
const defaultConfig = getDefaultConfig(__dirname);
defaultConfig.resolver.sourceExts.push('cjs');

// Apply NativeWind configuration and export
module.exports = withNativeWind(defaultConfig, { input: "./global.css" });