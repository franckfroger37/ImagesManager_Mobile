/**
 * App.web.js - Version web
 * Précharge la police Ionicons avant d'afficher l'app (sinon icônes vides)
 */
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen     from './screens/HomeScreen';
import CropScreen     from './screens/CropScreen';
import PublishScreen  from './screens/PublishScreen';
import SettingsScreen from './screens/SettingsScreen';

const Stack = createStackNavigator();

export default function App() {
  // Précharge la police des icônes Ionicons — sans ça les icônes restent vides sur web
  const [fontsLoaded] = useFonts(Ionicons.font);

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
            headerStyle:      { backgroundColor: '#2563eb' },
            headerTintColor:  '#fff',
            headerTitleStyle: { fontWeight: '700', fontSize: 18 },
            headerBackTitleVisible: false,
            // overflow:'hidden' + flex:1 = indispensable pour que
            // ScrollView fonctionne à l'intérieur des écrans sur web
            cardStyle: { backgroundColor: '#f8fafc', flex: 1, overflow: 'hidden' },
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
  root:    { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
});
