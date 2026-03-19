import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = 'images_manager_settings';

export const DEFAULT_SETTINGS = {
  wooUrl: '',
  consumerKey: '',
  consumerSecret: '',
  wpUsername: '',
  wpAppPassword: '',
  targetWidth: 800,
  targetHeight: 1200,
  targetQuality: 85,
  defaultCategory: 'boucles-oreilles',
};

export const CATEGORIES = [
  { label: 'Boucles d\'oreilles', value: 'boucles-oreilles' },
  { label: 'Colliers', value: 'colliers' },
  { label: 'Bracelets', value: 'bracelets' },
  { label: 'Bagues', value: 'bagues' },
  { label: 'Broches', value: 'broches' },
];

export const getSettings = async () => {
  try {
    const stored = await AsyncStorage.getItem(SETTINGS_KEY);
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    return { ...DEFAULT_SETTINGS };
  } catch (e) {
    return { ...DEFAULT_SETTINGS };
  }
};

export const saveSettings = async (settings) => {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch (e) {
    console.error('Erreur sauvegarde paramètres:', e);
    return false;
  }
};
