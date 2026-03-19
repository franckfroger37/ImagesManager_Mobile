// Stub for expo-font on web platform.
// expo-font v55+ uses `registerWebModule` from expo-modules-core which doesn't
// exist in expo-modules-core v1.12.26 (SDK 51). Stubbing the whole module
// avoids the crash. Fonts for @expo/vector-icons on web are loaded via CSS,
// so this stub is safe — icons still render correctly.

export async function loadAsync(nameOrMap, source) {
  // no-op on web: fonts are loaded via CSS @font-face
  return;
}

export function isLoaded(fontFamily) {
  return true;
}

export function isLoading(fontFamily) {
  return false;
}

export async function unloadAsync(nameOrMap) {
  return;
}

export function processFontFamily(fontFamily) {
  return fontFamily;
}

export function getLoadedFonts() {
  return [];
}

export function useFonts(map) {
  return [true, null];
}

export const FontDisplay = {
  AUTO: 'auto',
  BLOCK: 'block',
  SWAP: 'swap',
  FALLBACK: 'fallback',
  OPTIONAL: 'optional',
};
