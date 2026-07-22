module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // react-native-reanimated/plugin PRECISA ser o último (transforma worklets).
    plugins: ["react-native-reanimated/plugin"],
  };
};
