const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// React Native Web uyarılarını bastırmak için
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Path alias konfigürasyonu
config.resolver.alias = {
  '@': path.resolve(__dirname, './'),
};

// Web için özel konfigürasyon
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

module.exports = config;
