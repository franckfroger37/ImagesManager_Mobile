import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Image, Alert, ActivityIndicator, SafeAreaView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen({ navigation }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      // In a real app, you'd load from AsyncStorage or state management
    }, [])
  );

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Autorisez l\'accès à la caméra dans les réglages.');
      return;
    }

    setLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        exif: false,
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        navigateToProcess(asset);
      }
    } finally {
      setLoading(false);
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Autorisez l\'accès à la galerie dans les réglages.');
      return;
    }

    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsMultipleSelection: false,
        exif: false,
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        navigateToProcess(asset);
      }
    } finally {
      setLoading(false);
    }
  };

  const navigateToProcess = (asset) => {
    navigation.navigate('Crop', {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      fileName: asset.fileName || asset.uri.split('/').pop(),
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Choisir une photo à traiter</Text>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={pickFromCamera} disabled={loading}>
          <Ionicons name="camera" size={32} color="#fff" />
          <Text style={styles.actionBtnText}>Appareil photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={pickFromGallery} disabled={loading}>
          <Ionicons name="images" size={32} color="#2563eb" />
          <Text style={[styles.actionBtnText, styles.actionBtnSecondaryText]}>Galerie</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      )}

      <View style={styles.instructions}>
        <Ionicons name="information-circle-outline" size={20} color="#6b7280" />
        <Text style={styles.instructionsText}>
          Prenez une photo de votre bijou ou sélectionnez-en une depuis votre galerie.
          Vous pourrez ensuite la recadrer et la publier sur votre boutique.
        </Text>
      </View>

      <View style={styles.steps}>
        <Text style={styles.stepsTitle}>Workflow</Text>
        {[
          { icon: 'camera-outline', label: '① Choisir la photo' },
          { icon: 'crop-outline', label: '② Recadrer le bijou' },
          { icon: 'pricetag-outline', label: '③ Définir le prix & catégorie' },
          { icon: 'cloud-upload-outline', label: '④ Publier sur WooCommerce' },
        ].map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <Ionicons name={step.icon} size={20} color="#2563eb" />
            <Text style={styles.stepText}>{step.label}</Text>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  settingsBtn: { padding: 4 },
  actionRow: { flexDirection: 'row', padding: 16, gap: 12 },
  actionBtn: {
    flex: 1, backgroundColor: '#2563eb', borderRadius: 12,
    paddingVertical: 20, alignItems: 'center', justifyContent: 'center', gap: 8,
    elevation: 2, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4,
  },
  actionBtnSecondary: {
    backgroundColor: '#fff', borderWidth: 2, borderColor: '#2563eb',
    shadowColor: '#000', shadowOpacity: 0.1,
  },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  actionBtnSecondaryText: { color: '#2563eb' },
  loadingContainer: { alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 8, color: '#6b7280' },
  instructions: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    marginHorizontal: 16, padding: 12,
    backgroundColor: '#eff6ff', borderRadius: 10,
    borderLeftWidth: 3, borderLeftColor: '#2563eb',
  },
  instructionsText: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 20 },
  steps: {
    margin: 16, padding: 16, backgroundColor: '#fff', borderRadius: 12,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2,
  },
  stepsTitle: {
    fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 12,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  stepRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  stepText: { fontSize: 14, color: '#374151' },
});
