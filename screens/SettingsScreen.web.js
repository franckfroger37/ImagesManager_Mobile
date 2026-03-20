// Version WEB de SettingsScreen
// - settings initialisés de façon SYNCHRONE via getSettingsSync()
//   → pas de useEffect, pas de race condition, pas d'écrasement des saisies
// - Alertes remplacées par messages in-screen
// - Section debug pour diagnostiquer les problèmes de stockage
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSettingsSync, saveSettings, debugReadLocalStorage } from '../services/storageService';
import { testWooConnection, testWpAuth } from '../services/woocommerceService';

export default function SettingsScreen({ navigation }) {
  // Initialisation synchrone — localStorage lu immédiatement, sans async
  const [settings, setSettings] = useState(() => getSettingsSync());

  const [saving,     setSaving]     = useState(false);
  const [testingWoo, setTestingWoo] = useState(false);
  const [testingWp,  setTestingWp]  = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const [wooStatus,  setWooStatus]  = useState(null); // {ok, msg}
  const [wpStatus,   setWpStatus]   = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [debugInfo,  setDebugInfo]  = useState(null);

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
      setWooStatus({ ok: false, msg: `❌ ${e.message}` });
    } finally { setTestingWoo(false); }
  };

  const handleTestWp = async () => {
    setTestingWp(true);
    setWpStatus(null);
    try {
      const name = await testWpAuth(settings);
      setWpStatus({ ok: true, msg: `✅ Authentification OK — connecté en tant que : ${name}` });
    } catch (e) {
      setWpStatus({ ok: false, msg: `❌ ${e.message}` });
    } finally { setTestingWp(false); }
  };

  const handleDebug = () => {
    const fromStorage = debugReadLocalStorage();
    const lines = [];
    lines.push('=== Cache mémoire (actuel) ===');
    lines.push(`wooUrl: "${settings.wooUrl || '(vide)'}"`);
    lines.push(`consumerKey: "${settings.consumerKey ? '***' + settings.consumerKey.slice(-4) : '(vide)'}"`);
    lines.push(`consumerSecret: "${settings.consumerSecret ? '***' + settings.consumerSecret.slice(-4) : '(vide)'}"`);
    lines.push(`wpUsername: "${settings.wpUsername || '(vide)'}"`);
    lines.push(`wpAppPassword: "${settings.wpAppPassword ? '(défini)' : '(vide)'}"`);
    lines.push('');
    lines.push('=== localStorage ===');
    if (!fromStorage) {
      lines.push('(rien enregistré)');
    } else if (fromStorage.error) {
      lines.push(`ERREUR: ${fromStorage.error}`);
    } else {
      lines.push(`wooUrl: "${fromStorage.wooUrl || '(vide)'}"`);
      lines.push(`consumerKey: "${fromStorage.consumerKey ? '***' + fromStorage.consumerKey.slice(-4) : '(vide)'}"`);
      lines.push(`wpUsername: "${fromStorage.wpUsername || '(vide)'}"`);
    }
    setDebugInfo(lines.join('\n'));
  };

  const StatusBadge = ({ status }) => {
    if (!status) return null;
    return (
      <View style={[styles.badge, status.ok ? styles.badgeOk : styles.badgeErr]}>
        <Text style={[styles.badgeText, status.ok ? styles.badgeTextOk : styles.badgeTextErr]}>
          {status.msg}
        </Text>
      </View>
    );
  };

  const q = settings.targetQuality || 85;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        {/* ── WooCommerce ── */}
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
          <StatusBadge status={wooStatus} />
        </View>

        {/* ── WordPress ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="lock-closed-outline" size={20} color="#7c3aed" />
            <Text style={styles.cardTitle}>WordPress (upload images)</Text>
          </View>
          <View style={styles.hint}>
            <Text style={styles.hintText}>
              Créez un <Text style={{ fontWeight: '700' }}>"Mot de passe d'application"</Text> dans WordPress → Profil → Mots de passe d'application.
            </Text>
          </View>

          <Text style={styles.label}>Identifiant WordPress</Text>
          <TextInput style={styles.input} value={settings.wpUsername || ''} onChangeText={(v) => update('wpUsername', v)} placeholder="votre-login" autoCapitalize="none" />

          <Text style={styles.label}>Mot de passe d'application</Text>
          <TextInput style={styles.input} value={settings.wpAppPassword || ''} onChangeText={(v) => update('wpAppPassword', v)} placeholder="xxxx xxxx xxxx xxxx xxxx xxxx" autoCapitalize="none" secureTextEntry={!showSecrets} />

          <TouchableOpacity style={[styles.testBtn, styles.testBtnPurple]} onPress={handleTestWp} disabled={testingWp}>
            {testingWp ? <ActivityIndicator size="small" color="#7c3aed" /> : <Ionicons name="person-circle-outline" size={18} color="#7c3aed" />}
            <Text style={[styles.testBtnText, { color: '#7c3aed' }]}>Tester l'authentification WordPress</Text>
          </TouchableOpacity>
          <StatusBadge status={wpStatus} />
        </View>

        {/* ── Image ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="image-outline" size={20} color="#059669" />
            <Text style={styles.cardTitle}>Paramètres image</Text>
          </View>
          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>Largeur (px)</Text>
              <TextInput style={styles.input} value={String(settings.targetWidth || 800)} onChangeText={(v) => update('targetWidth', parseInt(v) || 800)} keyboardType="number-pad" />
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>Hauteur (px)</Text>
              <TextInput style={styles.input} value={String(settings.targetHeight || 1200)} onChangeText={(v) => update('targetHeight', parseInt(v) || 1200)} keyboardType="number-pad" />
            </View>
          </View>
          <Text style={styles.label}>Qualité ({q}%)</Text>
          <View style={styles.qualityRow}>
            {[60, 70, 75, 80, 85, 90, 95].map((qv) => (
              <TouchableOpacity key={qv} style={[styles.qualityBtn, q === qv && styles.qualityBtnOn]} onPress={() => update('targetQuality', qv)}>
                <Text style={[styles.qualityBtnText, q === qv && styles.qualityBtnTextOn]}>{qv}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.infoText}>📐 {settings.targetWidth || 800} × {settings.targetHeight || 1200} px — ratio {((settings.targetWidth || 800) / (settings.targetHeight || 1200)).toFixed(2)}</Text>
        </View>

        {/* ── Sauvegarder ── */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Ionicons name="save-outline" size={20} color="#fff" />}
          <Text style={styles.saveBtnText}>{saving ? 'Sauvegarde...' : '💾 Sauvegarder les paramètres'}</Text>
        </TouchableOpacity>
        <StatusBadge status={saveStatus} />

        {/* ── Debug ── */}
        <TouchableOpacity style={styles.debugBtn} onPress={handleDebug}>
          <Ionicons name="bug-outline" size={16} color="#6b7280" />
          <Text style={styles.debugBtnText}>🔍 Vérifier le stockage (diagnostic)</Text>
        </TouchableOpacity>
        {debugInfo ? (
          <View style={styles.debugBox}>
            <Text style={styles.debugText}>{debugInfo}</Text>
          </View>
        ) : null}

        <Text style={styles.version}>Images Manager Mobile v1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#f8fafc' },
  scroll:        { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  card:          { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
  cardHeader:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  cardTitle:     { fontSize: 16, fontWeight: '700', color: '#111827' },
  label:         { fontSize: 11, fontWeight: '700', color: '#6b7280', marginBottom: 6, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.4 },
  input:         { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, fontSize: 14, color: '#111827' },
  hint:          { backgroundColor: '#f5f3ff', borderRadius: 8, padding: 10, marginBottom: 4 },
  hintText:      { fontSize: 13, color: '#6b7280', lineHeight: 20 },
  toggleSecrets:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingVertical: 4 },
  toggleSecretsText: { fontSize: 13, color: '#6b7280' },
  testBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14, paddingVertical: 11, borderRadius: 8, borderWidth: 1.5, borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  testBtnPurple: { borderColor: '#7c3aed', backgroundColor: '#f5f3ff' },
  testBtnText:   { color: '#2563eb', fontSize: 13, fontWeight: '600' },
  badge:         { borderRadius: 8, padding: 10, marginTop: 10, borderLeftWidth: 3 },
  badgeOk:       { backgroundColor: '#f0fdf4', borderLeftColor: '#16a34a' },
  badgeErr:      { backgroundColor: '#fff1f2', borderLeftColor: '#e11d48' },
  badgeText:     { fontSize: 13 },
  badgeTextOk:   { color: '#15803d' },
  badgeTextErr:  { color: '#be123c' },
  row:           { flexDirection: 'row', gap: 12 },
  half:          { flex: 1 },
  qualityRow:    { flexDirection: 'row', gap: 4, marginTop: 8, flexWrap: 'wrap' },
  qualityBtn:    { flex: 1, minWidth: 36, paddingVertical: 9, backgroundColor: '#f3f4f6', borderRadius: 6, alignItems: 'center' },
  qualityBtnOn:  { backgroundColor: '#2563eb' },
  qualityBtnText:   { fontSize: 12, color: '#374151', fontWeight: '500' },
  qualityBtnTextOn: { color: '#fff', fontWeight: '700' },
  infoText:      { fontSize: 12, color: '#6b7280', marginTop: 10 },
  saveBtn:       { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  saveBtnText:   { color: '#fff', fontSize: 16, fontWeight: '700' },
  debugBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#f9fafb' },
  debugBtnText:  { fontSize: 13, color: '#6b7280' },
  debugBox:      { backgroundColor: '#1e293b', borderRadius: 8, padding: 12, marginTop: 8 },
  debugText:     { fontFamily: 'monospace', fontSize: 11, color: '#94a3b8', lineHeight: 18 },
  version:       { textAlign: 'center', color: '#9ca3af', fontSize: 12, marginTop: 16, marginBottom: 8 },
});
