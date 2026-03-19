/**
 * App.web.js - Version web MINIMALE pour diagnostic
 * Pas de navigation native, juste React Native Web de base
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

console.log('[App.web.js] Module loaded!');

export default function App() {
  console.log('[App.web.js] App rendering...');
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📷 Images Manager</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.message}>Application web en cours de chargement...</Text>
        <Text style={styles.sub}>Utilisez cette app depuis votre navigateur mobile.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#2563eb',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  message: {
    fontSize: 18,
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 12,
  },
  sub: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
});
