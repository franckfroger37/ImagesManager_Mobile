import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

import HomeScreen from './screens/HomeScreen';
import CropScreen from './screens/CropScreen';
import PublishScreen from './screens/PublishScreen';
import SettingsScreen from './screens/SettingsScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <NavigationContainer>
        <StatusBar style="light" />
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
            options={{ title: 'ð· Images Manager V2', headerLeft: () => null }}
          />
          <Stack.Screen
            name="Crop"
            component={CropScreen}
            options={{ title: 'âï¸ Recadrage', headerStyle: { backgroundColor: '#111827' } }}
          />
          <Stack.Screen
            name="Publish"
            component={PublishScreen}
            options={{ title: 'ð Publier le produit' }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: 'âï¸ ParamÃ¨tres' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
