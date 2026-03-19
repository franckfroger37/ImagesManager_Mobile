/**
 * index.js - Point d'entrée natif (iOS/Android)
 * Identique au comportement de expo/AppEntry.js
 */
import 'expo/build/Expo.fx';
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
