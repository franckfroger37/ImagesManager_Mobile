/**
 * App.web.js - Version web
 * Charge la police Ionicons depuis unpkg CDN (URL directe, fiable)
 * car le require() local du TTF n'est pas toujours exporté dans dist/assets/
 */
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';

import HomeScreen           from './screens/HomeScreen';
import CropScreen           from './screens/CropScreen';
import PublishScreen        from './screens/PublishScreen';
import SettingsScreen       from './screens/SettingsScreen';
import ManageProductsScreen from './screens/ManageProductsScreen';

const Stack = createStackNavigator();

// URL directe vers le TTF Ionicons — même fichier que @expo/vector-icons@14.0.2
const IONICONS_CDN =
  'https://unpkg.com/@expo/vector-icons@14.0.2/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf';

export default function App() {
  const [fontsLoaded] = Font.useFonts({ Ionicons: IONICONS_CDN });

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle:            { backgroundColor: '#2563eb' },
            headerTintColor:        '#fff',
            headerTitleStyle:       { fontWeight: '700', fontSize: 18 },
            headerBackTitleVisible: false,
            cardStyle: { backgroundColor: '#f8fafc', flex: 1, overflow: 'hidden' },
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: '📷 Images Manager V2', headerLeft: () => null }}
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
          <Stack.Screen
            name="ManageProducts"
            component={ManageProductsScreen}
            options={{ title: '📦 Gérer les produits' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
});
