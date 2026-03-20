// Version WEB de storageService
// Stratégie double : localStorage (persistant) + cache mémoire (session)
// Le cache mémoire garantit que les settings sont disponibles immédiatement
// après un save, même si localStorage échoue à la relecture.

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

// Cache mémoire — partagé entre tous les écrans (même module = même instance)
let _cache = null;

export const getSettings = async () => {
  // 1. Cache mémoire (priorité — instantané)
  if (_cache) return { ..._cache };

  // 2. localStorage (persistant entre rechargements)
  try {
    const stored = window.localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      _cache = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      return { ..._cache };
    }
  } catch (e) {
    console.warn('[storageService] localStorage read error:', e);
  }

  // 3. Defaults
  _cache = { ...DEFAULT_SETTINGS };
  return { ..._cache };
};

export const saveSettings = async (settings) => {
  // Mise à jour immédiate du cache mémoire
  _cache = { ...settings };

  // Persistance dans localStorage
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch (e) {
    console.warn('[storageService] localStorage write error:', e);
    // Le cache mémoire est quand même mis à jour → l'appli fonctionne pour la session
    return true;
  }
};
