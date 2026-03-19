// Web stub for expo-image-picker
// On web, image picking is handled directly in HomeScreen.web.js via <input type="file">
// This stub exists only to prevent Metro from trying to load the native module

export const MediaTypeOptions = {
  All: 'All',
  Videos: 'Videos',
  Images: 'Images',
};

export const requestMediaLibraryPermissionsAsync = async () => {
  return { status: 'granted', granted: true };
};

export const requestCameraPermissionsAsync = async () => {
  return { status: 'granted', granted: true };
};

export const launchImageLibraryAsync = async (options) => {
  // Not used on web — HomeScreen.web.js handles file input directly
  return { canceled: true, assets: [] };
};

export const launchCameraAsync = async (options) => {
  // Not used on web — HomeScreen.web.js handles camera input directly
  return { canceled: true, assets: [] };
};

export default {
  MediaTypeOptions,
  requestMediaLibraryPermissionsAsync,
  requestCameraPermissionsAsync,
  launchImageLibraryAsync,
  launchCameraAsync,
};
