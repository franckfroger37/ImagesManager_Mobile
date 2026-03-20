const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const originalResolver = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    const webStubs = {
      // Modules natifs sans implémentation web — remplacés par des no-ops
      'expo-file-system':       require.resolve('./stubs/expo-file-system.js'),
      'expo-image-manipulator': require.resolve('./stubs/expo-image-manipulator.js'),
      'expo-image-picker':      require.resolve('./stubs/expo-image-picker.js'),
    };
    if (webStubs[moduleName]) {
      return { filePath: webStubs[moduleName], type: 'sourceFile' };
    }
  }
  if (originalResolver) return originalResolver(context, moduleName, platform);
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
