/**
 * index.web.js - Point d'entrée Web
 * Contrairement à expo/AppEntry.js qui ne démarre jamais l'app sur le web,
 * ce fichier appelle explicitement AppRegistry.runApplication().
 */
import 'expo/build/Expo.fx';
import { AppRegistry } from 'react-native';
import App from './App';

// Enregistrer le composant racine
AppRegistry.registerComponent('main', () => App);

// Démarrer l'app explicitement (ce que expo/AppEntry.js ne fait pas sur le web)
if (typeof document !== 'undefined') {
  const rootTag = document.getElementById('root') || document.getElementById('main');
  if (rootTag) {
    AppRegistry.runApplication('main', {
      rootTag,
      hydrate: false,
      initialProps: {},
    });
  }
}
