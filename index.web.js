/**
 * index.web.js - Point d'entrée Web
 * Sans expo/build/Expo.fx (qui importe expo-modules-core natif et casse le web)
 * Appelle AppRegistry.runApplication() explicitement pour démarrer l'app.
 */
import { AppRegistry } from 'react-native';
import App from './App';

// Enregistrer le composant racine
AppRegistry.registerComponent('main', () => App);

// Démarrer l'app explicitement
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
