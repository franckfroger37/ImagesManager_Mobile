// Version WEB de SettingsScreen
// - Scroll fixé (hauteur 100vh, overflow auto)
// - Alert.alert remplacé par messages in-screen
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, ActivityIndicator,
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
  const [wooStatus, setWooStatus] = useState(null);   // { ok, msg }
  const [wpStatus, setWpStatus] = useState(null);     // { ok, msg }
  const [saveStatus, setSaveStatus] = useState(null); // { ok, msg }

  useEffect(() => { getSettings().then(setSettings); }, []);

  const update = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus(null);
    const ok = await saveSettings(settings);
    setSaving(false);
    setSaveStatus(ok
      ? { ok: true,  msg: '✅ Paramètres enregistrés avec succès.' }
      : { ok: false, msg: '❌ Impossible de sauvegarder les paramètres.' }
    );
  };

  const handleTestWoo = async () => {
    setTestingWoo(true);
    setWooStatus(null);
    try {
      await testWooConnection(settings);
      setWooStatus({ ok: true, msg: '✅ Connexion WooCommerce OK — clés API valides.' });
    } catch (e) {
      setWooStatus({ ok: false, msg: `❌ Échec : ${e.message}` });
    } finally { setTestingWoo(false); }
  };

  const handleTestWp = async () => {
    setTestingWp(true);
    setWpStatus(null);
    try {
      const name = await testWpAuth(settings);
      setWpStatus({ ok: true, msg: `✅ Authentification WordPress OK — connecté en tant que : ${name}` });
    } catch (e) {
      setWpStatus({ ok: false, msg: `❌ Échec : ${e.message}` });
    } finally { setTestingWp(false); }
  };

  const StatusBadge = ({ status }) => {
    if (!status) return null;
    return (
      <View style={[styles.statusBadge, status.ok ? styles.statusOk : styles.statusErr]}>
        <Text style={[styles.statusText, status.ok ? styles.statusTextOk : styles.statusTextErr]}>
          {status.msg}
        </Text>
      </View>
    );
  };

  const q = settings.targetQuality || 85;

  return (
    // div avec hauteur 100vh pour que le scroll fonctionne sur web
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, paddingBottom: 40 }}>

        {/* Card WooCommerce */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="storefront-outline" size={20} color="#2563eb" />
            <Text style={styles.cardTitle}>WooCommerce / Hostinger</Text>
          </View>

          <Text style={styles.label}>URL de la boutique</Text>
          <TextInput
            style={styles.input}
            value={settings.wooUrl || ''}
            onChangeText={(v) => update('wooUrl', v)}
            placeholder="https://lemondedechristine.fr"
            autoCapitalize="none"
            keyboardType="url"
          />

          <Text style={styles.label}>Consumer Key</Text>
          <TextInput
            style={styles.input}
            value={settings.consumerKey || ''}
            onChangeText={(v) => update('consumerKey', v)}
            placeholder="ck_..."
            autoCapitalize="none"
            secureTextEntry={!showSecrets}
          />

          <Text style={styles.label}>Consumer Secret</Text>
          <TextInput
            style={styles.input}
            value={settings.consumerSecret || ''}
            onChangeText={(v) => update('consumerSecret', v)}
            placeholder="cs_..."
            autoCapitalize="none"
            secureTextEntry={!showSecrets}
          />

          <TouchableOpacity style={styles.toggleSecrets} onPress={() => setShowSecrets(!showSecrets)}>
            <Ionicons name={showSecrets ? 'eye-off-outline' : 'eye-outline'} size={16} color="#6b7280" />
            <Text style={styles.toggleSecretsText}>{showSecrets ? 'Masquer les clés' : 'Afficher les clés'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.testBtn} onPress={handleTestWoo} disabled={testingWoo}>
            {testingWoo
              ? <ActivityIndicator size="small" color="#2563eb" />
              : <Ionicons name="wifi-outline" size={18} color="#2563eb" />}
            <Text style={styles.testBtnText}>Tester la connexion WooCommerce</Text>
          </TouchableOpacity>
          <StatusBadge status={wooStatus} />
        </View>

        {/* Card WordPress */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="lock-closed-outline" size={20} color="#7c3aed" />
            <Text style={styles.cardTitle}>WordPress (upload images)</Text>
          </View>

          <View style={styles.hint}>
            <Text style={styles.hintText}>
              Nécessaire pour l'upload automatique des images.{'\n'}
              Créez un <Text style={{ fontWeight: '700' }}>"Mot de passe d'application"</Text> dans WordPress → Profil.
            </Text>
          </View>

          <Text style={styles.label}>Identifiant WordPress</Text>
          <TextInput
            style={styles.input}
            value={settings.wpUsername || ''}
            onChangeText={(v) => update('wpUsername', v)}
            placeholder="votre-login"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Mot de passe d'application</Text>
          <TextInput
            style={styles.input}
            value={settings.wpAppPassword || ''}
            onChangeText={(v) => update('wpAppPassword', v)}
            placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
            autoCapitalize="none"
            secureTextEntry={!showSecrets}
          />

          <TouchableOpacity style={[styles.testBtn, styles.testBtnPurple]} onPress={handleTestWp} disabled={testingWp}>
            {testingWp
              ? <ActivityIndicator size="small" color="#7c3aed" />
              : <Ionicons name="person-circle-outline" size={18} color="#7c3aed" />}
            <Text style={[styles.testBtnText, styles.testBtnTextPurple]}>Tester l'authentification WordPress</Text>
          </TouchableOpacity>
          <StatusBadge status={wpStatus} />
        </View>

        {/* Card image */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="image-outline" size={20} color="#059669" />
            <Text style={styles.cardTitle}>Paramètres image</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Largeur (px)</Text>
              <TextInput
                style={styles.input}
                value={String(settings.targetWidth || 800)}
                onChangeText={(v) => update('targetWidth', parseInt(v) || 800)}
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Hauteur (px)</Text>
              <TextInput
                style={styles.input}
                value={String(settings.targetHeight || 1200)}
                onChangeText={(v) => update('targetHeight', parseInt(v) || 1200)}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <Text style={styles.label}>Qualité de compression ({q}%)</Text>
          <View style={styles.qualityBtns}>
            {[60, 70, 75, 80, 85, 90, 95].map((qv) => (
              <TouchableOpacity
                key={qv}
                style={[styles.qualityBtn, q === qv && styles.qualityBtnActive]}
                onPress={() => update('targetQuality', qv)}
              >
                <Text style={[styles.qualityBtnText, q === qv && styles.qualityBtnTextActive]}>{qv}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.infoText}>
            📐 {settings.targetWidth || 800} × {settings.targetHeight || 1200} px — ratio {((settings.targetWidth || 800) / (settings.targetHeight || 1200)).toFixed(2)}
          </Text>
        </View>

        {/* Bouton sauvegarder */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Ionicons name="save-outline" size={20} color="#fff" />}
          <Text style={styles.saveBtnText}>{saving ? 'Sauvegarde...' : '💾 Sauvegarder les paramètres'}</Text>
        </TouchableOpacity>

        <StatusBadge status={saveStatus} />

        <Text style={styles.version}>Images Manager Mobile v1.0</Text>
      </div>
    </div>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  label: { fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 6, marginTop: 10, textTransform: 'uppercase', letterSpacing: 0.3 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, fontSize: 14, color: '#111827' },
  hint: { backgroundColor: '#f5f3ff', borderRadius: 8, padding: 10, marginBottom: 4 },
  hintText: { fontSize: 13, color: '#6b7280', lineHeight: 20 },
  toggleSecrets: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingVertical: 4 },
  toggleSecretsText: { fontSize: 13, color: '#6b7280' },
  testBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14, paddingVertical: 10, borderRadius: 8, borderWidth: 1.5, borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  testBtnPurple: { borderColor: '#7c3aed', backgroundColor: '#f5f3ff' },
  testBtnText: { color: '#2563eb', fontSize: 13, fontWeight: '600' },
  testBtnTextPurple: { color: '#7c3aed' },
  statusBadge: { borderRadius: 8, padding: 10, marginTop: 10 },
  statusOk: { backgroundColor: '#f0fdf4', borderLeftWidth: 3, borderLeftColor: '#16a34a' },
  statusErr: { backgroundColor: '#fff1f2', borderLeftWidth: 3, borderLeftColor: '#e11d48' },
  statusText: { fontSize: 13 },
  statusTextOk: { color: '#15803d' },
  statusTextErr: { color: '#be123c' },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  qualityBtns: { flexDirection: 'row', gap: 4, marginTop: 8, flexWrap: 'wrap' },
  qualityBtn: { flex: 1, minWidth: 36, paddingVertical: 8, backgroundColor: '#f3f4f6', borderRadius: 6, alignItems: 'center' },
  qualityBtnActive: { backgroundColor: '#2563eb' },
  qualityBtnText: { fontSize: 12, color: '#374151' },
  qualityBtnTextActive: { color: '#fff', fontWeight: '700' },
  infoText: { fontSize: 12, color: '#6b7280', marginTop: 10 },
  saveBtn: { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  version: { textAlign: 'center', color: '#9ca3af', fontSize: 12, marginTop: 16, marginBottom: 8 },
});
