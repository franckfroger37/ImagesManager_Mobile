// Version WEB de storageService
// Utilise window.localStorage directement (plus fiable qu'AsyncStorage sur web)
// AsyncStorage peut échouer silencieusement sur certains hébergements statiques

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

export const getSettings = async () => {
  try {
    const stored = window.localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
    return { ...DEFAULT_SETTINGS };
  } catch (e) {
    console.warn('getSettings error:', e);
    return { ...DEFAULT_SETTINGS };
  }
};

export const saveSettings = async (settings) => {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    // Vérification immédiate
    const check = window.localStorage.getItem(SETTINGS_KEY);
    return check !== null;
  } catch (e) {
    console.error('saveSettings error:', e);
    return false;
  }
};
