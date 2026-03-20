// Version WEB de storageService
// Stratégie double :
//   1. Cache mémoire (module-level) — toujours disponible dans la session
//   2. localStorage — persiste entre les rechargements de page
// Si localStorage est bloqué (mode privé, navigateur strict, etc.),
// le cache mémoire prend le relai pour la durée de la session.

const SETTINGS_KEY = 'images_manager_settings';

export const DEFAULT_SETTINGS = {
  wooUrl:          '',
  consumerKey:     '',
  consumerSecret:  '',
  wpUsername:      '',
  wpAppPassword:   '',
  targetWidth:     800,
  targetHeight:    1200,
  targetQuality:   85,
  defaultCategory: 'boucles-oreilles',
};

export const CATEGORIES = [
  { label: "Boucles d'oreilles", value: 'boucles-oreilles' },
  { label: 'Colliers',           value: 'colliers' },
  { label: 'Bracelets',          value: 'bracelets' },
  { label: 'Bagues',             value: 'bagues' },
  { label: 'Broches',            value: 'broches' },
];

// ── Cache mémoire ─────────────────────────────────────────────────────────────
// Persiste tant que la page n'est pas rechargée.
// Évite toute perte de settings lors des navigations internes (SPA).
let _memoryCache = null;

// ── Lecture synchrone ─────────────────────────────────────────────────────────
export const getSettingsSync = () => {
  // 1. Cache mémoire en priorité (navigation SPA rapide)
  if (_memoryCache) {
    console.log('[storage] read from memory cache:', _memoryCache);
    return { ...DEFAULT_SETTINGS, ..._memoryCache };
  }
  // 2. Sinon, lecture localStorage
  try {
    const stored = window.localStorage.getItem(SETTINGS_KEY);
    console.log('[storage] read from localStorage, raw:', stored);
    if (stored) {
      const parsed = JSON.parse(stored);
      _memoryCache = parsed; // peupler le cache
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.warn('[storage] localStorage read error:', e);
  }
  console.log('[storage] no settings found, returning defaults');
  return { ...DEFAULT_SETTINGS };
};

// ── Lecture asynchrone (rétrocompat avec useFocusEffect dans PublishScreen) ───
export const getSettings = async () => getSettingsSync();

// ── Écriture ──────────────────────────────────────────────────────────────────
export const saveSettings = async (settings) => {
  // Toujours mettre à jour le cache mémoire immédiatement
  _memoryCache = { ...settings };
  console.log('[storage] saved to memory cache:', _memoryCache);
  try {
    const json = JSON.stringify(settings);
    window.localStorage.setItem(SETTINGS_KEY, json);
    console.log('[storage] saved to localStorage, key:', SETTINGS_KEY, 'value:', json);
    return true;
  } catch (e) {
    console.warn('[storage] localStorage write error (cache ok):', e);
    return false; // Cache mémoire reste à jour même si localStorage échoue
  }
};

// ── Debug : lit directement localStorage (pas le cache) ───────────────────────
export const debugReadLocalStorage = () => {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return { error: String(e) };
  }
};
