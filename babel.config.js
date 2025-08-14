module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // React Native Web uyarılarını bastırmak için
      ['transform-remove-console', { exclude: ['error', 'warn'] }],
    ],
  };
};
