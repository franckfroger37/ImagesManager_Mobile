// Version WEB de HomeScreen — utilise <input type="file"> au lieu d'expo-image-picker
import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen({ navigation }) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    setLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const uri = e.target.result;
      const img = new Image();
      img.onload = () => {
        setLoading(false);
        navigation.navigate('Crop', {
          uri,
          width: img.width,
          height: img.height,
          fileName: file.name,
        });
      };
      img.src = uri;
    };
    reader.readAsDataURL(file);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Input caché pour la galerie */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files[0])}
      />
      {/* Input caché pour la caméra */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files[0])}
      />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Choisir une photo à traiter</Text>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings-outline" size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => cameraInputRef.current?.click()}
          disabled={loading}
        >
          <Ionicons name="camera" size={32} color="#fff" />
          <Text style={styles.actionBtnText}>Appareil photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnSecondary]}
          onPress={() => fileInputRef.current?.click()}
          disabled={loading}
        >
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

      {/* Bouton Gérer les produits */}
      <TouchableOpacity
        style={styles.manageBtn}
        onPress={() => navigation.navigate('ManageProducts')}
      >
        <Ionicons name="cube-outline" size={20} color="#7c3aed" />
        <Text style={styles.manageBtnText}>📦 Gérer les produits publiés</Text>
        <Ionicons name="chevron-forward" size={18} color="#7c3aed" />
      </TouchableOpacity>

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
          { icon: 'camera-outline',       label: '① Choisir la photo' },
          { icon: 'crop-outline',         label: '② Recadrer le bijou' },
          { icon: 'pricetag-outline',     label: '③ Définir le prix & catégorie' },
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
  headerTitle:  { fontSize: 16, fontWeight: '600', color: '#111827' },
  settingsBtn:  { padding: 4 },
  actionRow:    { flexDirection: 'row', padding: 16, gap: 12 },
  actionBtn: {
    flex: 1, backgroundColor: '#2563eb', borderRadius: 12,
    paddingVertical: 20, alignItems: 'center', justifyContent: 'center', gap: 8,
    cursor: 'pointer',
  },
  actionBtnSecondary:     { backgroundColor: '#fff', borderWidth: 2, borderColor: '#2563eb' },
  actionBtnText:          { color: '#fff', fontSize: 14, fontWeight: '600' },
  actionBtnSecondaryText: { color: '#2563eb' },
  loadingContainer: { alignItems: 'center', padding: 20 },
  loadingText:      { marginTop: 8, color: '#6b7280' },
  manageBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: '#f5f3ff', borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 16,
    borderWidth: 1, borderColor: '#ddd6fe',
  },
  manageBtnText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#7c3aed' },
  instructions: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    marginHorizontal: 16, padding: 12,
    backgroundColor: '#eff6ff', borderRadius: 10,
    borderLeftWidth: 3, borderLeftColor: '#2563eb',
  },
  instructionsText: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 20 },
  steps: { margin: 16, padding: 16, backgroundColor: '#fff', borderRadius: 12 },
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
