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

  // ── PWA : injecter le manifest et enregistrer le service worker ──────────
  // (approche JS : fonctionne même si le patch HTML CI échoue)

  // 1. Lien manifest.json (nécessaire pour que Chrome propose l'installation)
  if (!document.querySelector('link[rel="manifest"]')) {
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = '/ImagesManager_Mobile/manifest.json';
    document.head.appendChild(link);
  }

  // 2. Couleur de thème
  if (!document.querySelector('meta[name="theme-color"]')) {
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = '#2563eb';
    document.head.appendChild(meta);
  }

  // 3. Icône Apple (iOS)
  if (!document.querySelector('link[rel="apple-touch-icon"]')) {
    const apple = document.createElement('link');
    apple.rel = 'apple-touch-icon';
    apple.href = '/ImagesManager_Mobile/icon-512.png';
    document.head.appendChild(apple);
  }

  // 4. Service Worker (nécessaire pour PWA installable)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker
        .register('/ImagesManager_Mobile/sw.js')
        .then(function (reg) {
          console.log('[PWA] Service Worker enregistré, scope:', reg.scope);
        })
        .catch(function (err) {
          console.warn('[PWA] Service Worker échec:', err);
        });
    });
  }
}
