// Version WEB de imageService — utilise Canvas API au lieu des modules natifs Expo

/**
 * Traite une image : recadrage + redimensionnement + compression (Canvas API)
 */
export const processImage = async (uri, cropParams, options = {}) => {
  const { targetWidth = 800, targetHeight = 1200, quality = 85 } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      let sx = 0, sy = 0, sw = img.width, sh = img.height;
      if (cropParams) {
        sx = cropParams.originX;
        sy = cropParams.originY;
        sw = cropParams.width;
        sh = cropParams.height;
      }

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);
      const dataUrl = canvas.toDataURL('image/jpeg', quality / 100);
      resolve(dataUrl);
    };
    img.onerror = reject;
    img.src = uri;
  });
};

/**
 * Calcul du recadrage centré (identique à la version native)
 */
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

/**
 * Taille estimée depuis un data URL
 */
export const getFileSize = async (uri) => {
  try {
    const base64 = uri.split(',')[1] || '';
    return Math.round((base64.length * 3) / 4 / 1024);
  } catch {
    return 0;
  }
};

/**
 * Génère un nom Ref_XXXXXX depuis un nom de fichier
 */
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

/**
 * Sur web, on retourne juste l'URI (pas de système de fichiers)
 */
export const saveProcessedImage = async (uri, refName) => {
  return uri;
};
