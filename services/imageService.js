import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

export const processImage = async (uri, cropParams, options = {}) => {
  const { targetWidth = 800, targetHeight = 1200, quality = 85 } = options;
  const actions = [];

  if (cropParams) {
    actions.push({
      crop: {
        originX: Math.round(cropParams.originX),
        originY: Math.round(cropParams.originY),
        width: Math.round(cropParams.width),
        height: Math.round(cropParams.height),
      },
    });
  }

  actions.push({ resize: { width: targetWidth, height: targetHeight } });

  const result = await ImageManipulator.manipulateAsync(uri, actions, {
    compress: quality / 100,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  return result.uri;
};

export const calcCenterCrop = (origWidth, origHeight, targetWidth, targetHeight) => {
  const targetRatio = targetWidth / targetHeight;
  const origRatio = origWidth / origHeight;

  let cropW, cropH, cropX, cropY;

  if (origRatio > targetRatio) {
    cropH = origHeight;
    cropW = origHeight * targetRatio;
    cropX = (origWidth - cropW) / 2;
    cropY = 0;
  } else {
    cropW = origWidth;
    cropH = origWidth / targetRatio;
    cropX = 0;
    cropY = (origHeight - cropH) / 2;
  }

  return {
    originX: Math.round(cropX),
    originY: Math.round(cropY),
    width: Math.round(cropW),
    height: Math.round(cropH),
  };
};

export const getFileSize = async (uri) => {
  try {
    const info = await FileSystem.getInfoAsync(uri, { size: true });
    return Math.round((info.size || 0) / 1024);
  } catch {
    return 0;
  }
};

export const generateRefName = (fileName) => {
  if (!fileName) {
    const ts = Date.now().toString();
    return `Ref_${ts.slice(-6)}`;
  }
  const match = fileName.match(/(\d{6})/);
  if (match) return `Ref_${match[1]}`;
  const digits = fileName.replace(/\D/g, '');
  if (digits.length >= 6) return `Ref_${digits.slice(-6)}`;
  const ts = Date.now().toString();
  return `Ref_${ts.slice(-6)}`;
};

export const saveProcessedImage = async (uri, refName) => {
  const destDir = FileSystem.documentDirectory + 'processed/';
  await FileSystem.makeDirectoryAsync(destDir, { intermediates: true });
  const destPath = destDir + refName + '.jpg';
  await FileSystem.copyAsync({ from: uri, to: destPath });
  return destPath;
};
