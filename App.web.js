/**
 * App.web.js - Version web
 * Charge la police Ionicons depuis unpkg CDN (URL directe, fiable)
 */
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';

import HomeScreen from './screens/HomeScreen';
import CropScreen from './screens/CropScreen';
import PublishScreen from './screens/PublishScreen';
import SettingsScreen from './screens/SettingsScreen';
import ManageProductsScreen from './screens/ManageProductsScreen';

const Stack = createStackNavigator();

const IONICONS_CDN = 'https://unpkg.com/@expo/vector-icons@14.0.2/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf';

// ErrorBoundary global - attrape les erreurs au niveau du navigator
class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error: String(error) };
  }
  componentDidCatch(error, info) {
    console.error('AppErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#fff' }}>
          <Text style={{ color: '#dc2626', fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Erreur application</Text>
          <Text style={{ color: '#374151', fontSize: 12, textAlign: 'center', marginBottom: 20 }}>{this.state.error}</Text>
          <TouchableOpacity
            style={{ backgroundColor: '#2563eb', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>Recharger</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

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
    <AppErrorBoundary>
      <View style={styles.root}>
        <StatusBar style="light" />
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: '#2563eb' },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: '700', fontSize: 18 },
              headerBackTitleVisible: false,
              cardStyle: { backgroundColor: '#f8fafc', flex: 1, overflow: 'hidden' },
            }}
          >
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Images Manager V2', headerLeft: () => null }} />
            <Stack.Screen name="Crop" component={CropScreen} options={{ title: 'Recadrage', headerStyle: { backgroundColor: '#111827' } }} />
            <Stack.Screen name="Publish" component={PublishScreen} options={{ title: 'Publier le produit' }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Parametres' }} />
            <Stack.Screen name="ManageProducts" component={ManageProductsScreen} options={{ title: 'Gerer les produits' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </View>
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
});
