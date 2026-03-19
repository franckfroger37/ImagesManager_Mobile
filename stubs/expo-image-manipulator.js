// Web stub for expo-image-manipulator
// Uses Canvas API on web

export const SaveFormat = {
  JPEG: 'jpeg',
  PNG: 'png',
  WEBP: 'webp',
};

export const manipulateAsync = async (uri, actions = [], saveOptions = {}) => {
  const { compress = 0.85, format = SaveFormat.JPEG } = saveOptions;
  const mimeType = format === SaveFormat.PNG ? 'image/png' : 'image/jpeg';

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      let srcX = 0, srcY = 0, srcW = img.width, srcH = img.height;
      let dstW = img.width, dstH = img.height;

      for (const action of actions) {
        if (action.crop) {
          srcX = action.crop.originX;
          srcY = action.crop.originY;
          srcW = action.crop.width;
          srcH = action.crop.height;
        }
        if (action.resize) {
          dstW = action.resize.width || dstW;
          dstH = action.resize.height || dstH;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = dstW;
      canvas.height = dstH;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, dstW, dstH);

      const dataUrl = canvas.toDataURL(mimeType, compress);
      resolve({ uri: dataUrl, width: dstW, height: dstH });
    };

    img.onerror = (e) => reject(new Error('Failed to load image for manipulation'));
    img.src = uri;
  });
};

export default {
  SaveFormat,
  manipulateAsync,
};
