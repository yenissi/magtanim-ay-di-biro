const { getDefaultConfig } = require("@expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

// Get the default Expo Metro config
const defaultConfig = getDefaultConfig(__dirname);

// Configure SVG transformer
// defaultConfig.transformer = {
//   ...defaultConfig.transformer,
//   babelTransformerPath: require.resolve("react-native-svg-transformer"),
// };
// defaultConfig.resolver = {
//   ...defaultConfig.resolver,
//   assetExts: defaultConfig.resolver.assetExts.filter((ext) => ext !== "svg"), // Exclude SVG from asset extensions
//   sourceExts: [...defaultConfig.resolver.sourceExts, "svg"], // Add SVG to source extensions
// };

// Apply NativeWind configuration and export
module.exports = withNativeWind(defaultConfig, { input: "./global.css" });