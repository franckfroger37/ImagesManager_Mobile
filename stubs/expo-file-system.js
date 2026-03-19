// Web stub for expo-file-system
// On web, we don't need native file system access

export const documentDirectory = '';
export const cacheDirectory = '';
export const bundleDirectory = '';

export const EncodingType = {
  UTF8: 'utf8',
  Base64: 'base64',
};

export const readAsStringAsync = async (uri, options) => {
  // On web, images are already data URLs or blob URLs - no need to read as base64
  if (uri && uri.startsWith('data:')) {
    const base64 = uri.split(',')[1];
    return base64 || '';
  }
  return '';
};

export const writeAsStringAsync = async (uri, content, options) => {
  return;
};

export const deleteAsync = async (uri, options) => {
  return;
};

export const moveAsync = async (options) => {
  return;
};

export const copyAsync = async (options) => {
  return;
};

export const makeDirectoryAsync = async (uri, options) => {
  return;
};

export const getInfoAsync = async (uri, options) => {
  return { exists: true, isDirectory: false, size: 0, modificationTime: 0, uri };
};

export const downloadAsync = async (uri, fileUri, options) => {
  return { uri: fileUri, status: 200, headers: {}, md5: '' };
};

export default {
  documentDirectory,
  cacheDirectory,
  bundleDirectory,
  EncodingType,
  readAsStringAsync,
  writeAsStringAsync,
  deleteAsync,
  moveAsync,
  copyAsync,
  makeDirectoryAsync,
  getInfoAsync,
  downloadAsync,
};
