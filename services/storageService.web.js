// Version WEB de storageService
// localStorage est synchrone — on l'exploite directement sans async/await
// pour éviter les race conditions dans les composants React.

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

// ── Lecture synchrone ────────────────────────────────────────────────────────
// Utilisée comme initializer de useState() → pas de useEffect, pas de race.
export const getSettingsSync = () => {
  try {
    const stored = window.localStorage.getItem(SETTINGS_KEY);
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch (e) { /* localStorage indisponible */ }
  return { ...DEFAULT_SETTINGS };
};

// ── Lecture asynchrone (rétrocompat avec useFocusEffect dans PublishScreen) ──
export const getSettings = async () => getSettingsSync();

// ── Écriture ─────────────────────────────────────────────────────────────────
export const saveSettings = async (settings) => {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch (e) {
    console.error('[storageService] write error:', e);
    return false;
  }
};
