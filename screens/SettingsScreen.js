import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Alert, ActivityIndicator, SafeAreaView, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSettings, saveSettings } from '../services/storageService';
import { testWooConnection, testWpAuth } from '../services/woocommerceService';

export default function SettingsScreen({ navigation }) {
  const [settings, setSettings] = useState({});
  const [saving, setSaving] = useState(false);
  const [testingWoo, setTestingWoo] = useState(false);
  const [testingWp, setTestingWp] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);

  useEffect(() => { getSettings().then(setSettings); }, []);

  const update = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    const ok = await saveSettings(settings);
    setSaving(false);
    if (ok) Alert.alert('✅ Sauvegardé', 'Vos paramètres ont été enregistrés.');
    else Alert.alert('Erreur', 'Impossible de sauvegarder les paramètres.');
  };

  const handleTestWoo = async () => {
    setTestingWoo(true);
    try {
      await testWooConnection(settings);
      Alert.alert('✅ Connexion WooCommerce OK', 'Vos clés API fonctionnent correctement.');
    } catch (e) {
      Alert.alert('❌ Connexion échouée', e.message);
    } finally { setTestingWoo(false); }
  };

  const handleTestWp = async () => {
    setTestingWp(true);
    try {
      const name = await testWpAuth(settings);
      Alert.alert('✅ Authentification WordPress OK', `Connecté en tant que : ${name}`);
    } catch (e) {
      Alert.alert('❌ Authentification échouée', e.message);
    } finally { setTestingWp(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="storefront-outline" size={20} color="#2563eb" />
            <Text style={styles.cardTitle}>WooCommerce / Hostinger</Text>
          </View>
          <Text style={styles.label}>URL de la boutique</Text>
          <TextInput style={styles.input} value={settings.wooUrl || ''} onChangeText={(v) => update('wooUrl', v)} placeholder="https://lemondedechristine.fr" autoCapitalize="none" keyboardType="url" />
          <Text style={styles.label}>Consumer Key</Text>
          <TextInput style={styles.input} value={settings.consumerKey || ''} onChangeText={(v) => update('consumerKey', v)} placeholder="ck_..." autoCapitalize="none" secureTextEntry={!showSecrets} />
          <Text style={styles.label}>Consumer Secret</Text>
          <TextInput style={styles.input} value={settings.consumerSecret || ''} onChangeText={(v) => update('consumerSecret', v)} placeholder="cs_..." autoCapitalize="none" secureTextEntry={!showSecrets} />
          <TouchableOpacity style={styles.toggleSecrets} onPress={() => setShowSecrets(!showSecrets)}>
            <Ionicons name={showSecrets ? 'eye-off-outline' : 'eye-outline'} size={16} color="#6b7280" />
            <Text style={styles.toggleSecretsText}>{showSecrets ? 'Masquer les clés' : 'Afficher les clés'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.testBtn} onPress={handleTestWoo} disabled={testingWoo}>
            {testingWoo ? <ActivityIndicator size="small" color="#2563eb" /> : <Ionicons name="wifi-outline" size={18} color="#2563eb" />}
            <Text style={styles.testBtnText}>Tester la connexion WooCommerce</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="lock-closed-outline" size={20} color="#7c3aed" />
            <Text style={styles.cardTitle}>WordPress (upload images)</Text>
          </View>
          <Text style={styles.hint}>Nécessaire pour l'upload automatique des images.{'\n'}Créez un "Mot de passe d'application" dans WordPress → Profil.</Text>
          <Text style={styles.label}>Identifiant WordPress</Text>
          <TextInput style={styles.input} value={settings.wpUsername || ''} onChangeText={(v) => update('wpUsername', v)} placeholder="votre-login" autoCapitalize="none" />
          <Text style={styles.label}>Mot de passe d'application</Text>
          <TextInput style={styles.input} value={settings.wpAppPassword || ''} onChangeText={(v) => update('wpAppPassword', v)} placeholder="xxxx xxxx xxxx xxxx xxxx xxxx" autoCapitalize="none" secureTextEntry={!showSecrets} />
          <TouchableOpacity style={[styles.testBtn, styles.testBtnPurple]} onPress={handleTestWp} disabled={testingWp}>
            {testingWp ? <ActivityIndicator size="small" color="#7c3aed" /> : <Ionicons name="person-circle-outline" size={18} color="#7c3aed" />}
            <Text style={[styles.testBtnText, styles.testBtnTextPurple]}>Tester l'authentification WordPress</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="image-outline" size={20} color="#059669" />
            <Text style={styles.cardTitle}>Paramètres image</Text>
          </View>
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Largeur (px)</Text>
              <TextInput style={styles.input} value={String(settings.targetWidth || 800)} onChangeText={(v) => update('targetWidth', parseInt(v) || 800)} keyboardType="number-pad" />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Hauteur (px)</Text>
              <TextInput style={styles.input} value={String(settings.targetHeight || 1200)} onChangeText={(v) => update('targetHeight', parseInt(v) || 1200)} keyboardType="number-pad" />
            </View>
          </View>
          <Text style={styles.label}>Qualité de compression ({settings.targetQuality || 85}%)</Text>
          <View style={styles.qualityRow}>
            <Text style={styles.qualityMin}>60%</Text>
            <View style={styles.qualityBtns}>
              {[60, 70, 75, 80, 85, 90, 95].map((q) => (
                <TouchableOpacity key={q} style={[styles.qualityBtn, (settings.targetQuality || 85) === q && styles.qualityBtnActive]} onPress={() => update('targetQuality', q)}>
                  <Text style={[styles.qualityBtnText, (settings.targetQuality || 85) === q && styles.qualityBtnTextActive]}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.qualityMax}>95%</Text>
          </View>
          <Text style={styles.infoText}>📐 {(settings.targetWidth || 800)} × {(settings.targetHeight || 1200)} px ({((settings.targetWidth || 800) / (settings.targetHeight || 1200)).toFixed(2)} ratio)</Text>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Ionicons name="save-outline" size={20} color="#fff" />}
          <Text style={styles.saveBtnText}>{saving ? 'Sauvegarde...' : '💾 Sauvegarder les paramètres'}</Text>
        </TouchableOpacity>
        <Text style={styles.version}>Images Manager Mobile v1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  label: { fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 6, marginTop: 10, textTransform: 'uppercase' },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, fontSize: 14, color: '#111827' },
  hint: { fontSize: 13, color: '#6b7280', backgroundColor: '#f5f3ff', borderRadius: 8, padding: 10, lineHeight: 20, marginBottom: 4 },
  toggleSecrets: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingVertical: 4 },
  toggleSecretsText: { fontSize: 13, color: '#6b7280' },
  testBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14, paddingVertical: 10, borderRadius: 8, borderWidth: 1.5, borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  testBtnPurple: { borderColor: '#7c3aed', backgroundColor: '#f5f3ff' },
  testBtnText: { color: '#2563eb', fontSize: 13, fontWeight: '600' },
  testBtnTextPurple: { color: '#7c3aed' },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  qualityRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  qualityMin: { fontSize: 11, color: '#9ca3af', width: 32 },
  qualityMax: { fontSize: 11, color: '#9ca3af', width: 32, textAlign: 'right' },
  qualityBtns: { flex: 1, flexDirection: 'row', gap: 4 },
  qualityBtn: { flex: 1, paddingVertical: 6, backgroundColor: '#f3f4f6', borderRadius: 6, alignItems: 'center' },
  qualityBtnActive: { backgroundColor: '#2563eb' },
  qualityBtnText: { fontSize: 11, color: '#374151' },
  qualityBtnTextActive: { color: '#fff', fontWeight: '700' },
  infoText: { fontSize: 12, color: '#6b7280', marginTop: 10 },
  saveBtn: { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, elevation: 2, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  version: { textAlign: 'center', color: '#9ca3af', fontSize: 12, marginTop: 16 },
});
