/**
 * App.web.js - Version web de l'application
 * Utilise React Navigation Web-compatible sans GestureHandlerRootView
 * qui ne fonctionne pas bien sur web avec react-native-screens.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';

import HomeScreen from './screens/HomeScreen';
import CropScreen from './screens/CropScreen';
import PublishScreen from './screens/PublishScreen';
import SettingsScreen from './screens/SettingsScreen';

const Stack = createStackNavigator();

export default function App() {
  console.log('[App.web.js] Mounting web app...');
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: '#2563eb' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: '700', fontSize: 18 },
            headerBackTitleVisible: false,
            cardStyle: { backgroundColor: '#f8fafc' },
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: '📷 Images Manager', headerLeft: () => null }}
          />
          <Stack.Screen
            name="Crop"
            component={CropScreen}
            options={{ title: '✂️ Recadrage', headerStyle: { backgroundColor: '#111827' } }}
          />
          <Stack.Screen
            name="Publish"
            component={PublishScreen}
            options={{ title: '🚀 Publier le produit' }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: '⚙️ Paramètres' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
