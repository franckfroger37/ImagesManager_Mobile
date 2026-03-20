import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Image, ActivityIndicator, SafeAreaView, Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getSettings, CATEGORIES } from '../services/storageService';
import { processImage, generateRefName, getFileSize } from '../services/imageService';
import { publishProduct } from '../services/woocommerceService';

export default function PublishScreen({ route, navigation }) {
  const { uri, fileName, cropParams } = route.params;

  const [price, setPrice] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressType, setProgressType] = useState('info');
  const [settings, setSettings] = useState(null);
  const [refName] = useState(() => generateRefName(fileName));
  const [done, setDone] = useState(false);

  // useFocusEffect = se relance à chaque fois que l'écran est affiché,
  // y compris quand on revient depuis l'écran Paramètres
  useFocusEffect(
    useCallback(() => {
      getSettings().then((s) => {
        setSettings(s);
        const defaultCat = CATEGORIES.find((c) => c.value === s.defaultCategory) || CATEGORIES[0];
        setSelectedCategory(defaultCat);
      });
    }, [])
  );

  const settingsOk = settings?.wooUrl && settings?.consumerKey && settings?.consumerSecret;

  const setMsg = (msg, type = 'info') => {
    setProgressMsg(msg);
    setProgressType(type);
  };

  const handlePublish = async () => {
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      setMsg('⚠️ Veuillez saisir un prix valide avant de publier.', 'error');
      return;
    }
    if (!settingsOk) {
      setMsg('⚠️ Paramètres WooCommerce manquants — cliquez sur ⚙️ pour les configurer.', 'error');
      return;
    }

    setProcessing(true);
    setDone(false);
    try {
      setMsg('⚙️ Traitement de l\'image en cours...', 'info');
      const processedUri = await processImage(uri, cropParams, {
        targetWidth:  settings.targetWidth  || 800,
        targetHeight: settings.targetHeight || 1200,
        quality:      settings.targetQuality || 85,
      });

      const sizKb = await getFileSize(processedUri);
      setMsg(`✅ Image traitée (${sizKb} Ko) — publication en cours...`, 'info');

      const result = await publishProduct({
        processedImageUri: processedUri,
        refName,
        price: parseFloat(price),
        description: '',
        categorySlug:  selectedCategory.value,
        categoryLabel: selectedCategory.label,
        settings,
        onProgress: (msg) => setMsg(msg, 'info'),
      });

      setProcessing(false);
      setDone(true);
      setMsg(`✅ Produit "${refName}" publié avec succès !`, 'success');
    } catch (error) {
      setProcessing(false);
      setMsg(`❌ Erreur : ${error.message || 'Une erreur est survenue.'}`, 'error');
    }
  };

  const pc = {
    info:    { bg: '#f0fdf4', border: '#16a34a', text: '#15803d' },
    error:   { bg: '#fff1f2', border: '#e11d48', text: '#be123c' },
    success: { bg: '#f0fdf4', border: '#16a34a', text: '#15803d' },
  }[progressType] || { bg: '#f0fdf4', border: '#16a34a', text: '#15803d' };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <View style={styles.previewCard}>
          <Image source={{ uri }} style={styles.preview} resizeMode="cover" />
          <View style={styles.previewInfo}>
            <Text style={styles.refName}>{refName}</Text>
            <Text style={styles.refSub}>Photo originale</Text>
          </View>
        </View>

        {/* Bannière si paramètres manquants */}
        {settings && !settingsOk && (
          <TouchableOpacity style={styles.warningBanner} onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="warning-outline" size={18} color="#92400e" />
            <Text style={styles.warningText}>
              Paramètres WooCommerce non configurés — tapez ici pour les saisir
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#92400e" />
          </TouchableOpacity>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>💰 Prix de vente (€)</Text>
          <TextInput
            style={styles.priceInput}
            value={price}
            onChangeText={setPrice}
            placeholder="0.00"
            placeholderTextColor="#9ca3af"
            keyboardType="decimal-pad"
            returnKeyType="done"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>🏷️ Catégorie</Text>
          <TouchableOpacity style={styles.categorySelector} onPress={() => setShowCategoryPicker(true)}>
            <Text style={styles.categorySelectorText}>{selectedCategory.label}</Text>
            <Ionicons name="chevron-down" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>📐 Paramètres image</Text>
          <View style={styles.infoRow}>
            <Ionicons name="resize-outline" size={16} color="#6b7280" />
            <Text style={styles.infoText}>{settings?.targetWidth || 800} × {settings?.targetHeight || 1200} px</Text>
            <Ionicons name="speedometer-outline" size={16} color="#6b7280" style={{ marginLeft: 16 }} />
            <Text style={styles.infoText}>Qualité {settings?.targetQuality || 85}%</Text>
          </View>
        </View>

        {progressMsg ? (
          <View style={[styles.progressBox, { backgroundColor: pc.bg, borderLeftColor: pc.border }]}>
            <Text style={[styles.progressText, { color: pc.text }]}>{progressMsg}</Text>
          </View>
        ) : null}

        {done ? (
          <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.navigate('Home')}>
            <Ionicons name="home-outline" size={22} color="#fff" />
            <Text style={styles.publishBtnText}>Retour à l'accueil</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.publishBtn, (processing || !settingsOk) && styles.publishBtnDisabled]}
            onPress={handlePublish}
            disabled={processing}
          >
            {processing
              ? <ActivityIndicator color="#fff" />
              : <Ionicons name="cloud-upload-outline" size={22} color="#fff" />}
            <Text style={styles.publishBtnText}>
              {processing ? 'Traitement en cours...' : '🚀 Traiter & Publier'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} disabled={processing}>
          <Ionicons name="crop-outline" size={18} color="#6b7280" />
          <Text style={styles.backBtnText}>Modifier le recadrage</Text>
        </TouchableOpacity>

      </ScrollView>

      <Modal visible={showCategoryPicker} transparent animationType="slide" onRequestClose={() => setShowCategoryPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choisir une catégorie</Text>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[styles.catOption, selectedCategory.value === cat.value && styles.catOptionSelected]}
                onPress={() => { setSelectedCategory(cat); setShowCategoryPicker(false); }}
              >
                <Text style={[styles.catOptionText, selectedCategory.value === cat.value && styles.catOptionTextSelected]}>
                  {cat.label}
                </Text>
                {selectedCategory.value === cat.value && <Ionicons name="checkmark" size={20} color="#2563eb" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#f8fafc' },
  scroll:         { padding: 16, paddingBottom: 40 },
  previewCard:    { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  preview:        { width: 80, height: 80 },
  previewInfo:    { flex: 1, padding: 12, justifyContent: 'center' },
  refName:        { fontSize: 16, fontWeight: '700', color: '#111827' },
  refSub:         { fontSize: 12, color: '#6b7280', marginTop: 2 },
  warningBanner:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fbbf24', borderRadius: 10, padding: 12, marginBottom: 12 },
  warningText:    { flex: 1, fontSize: 13, color: '#92400e', fontWeight: '500' },
  section:        { marginBottom: 16 },
  sectionLabel:   { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.3 },
  priceInput:     { backgroundColor: '#fff', borderRadius: 10, borderWidth: 2, borderColor: '#2563eb', padding: 14, fontSize: 28, fontWeight: '700', color: '#111827', textAlign: 'center' },
  categorySelector:     { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categorySelectorText: { fontSize: 16, color: '#111827', fontWeight: '500' },
  infoRow:        { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  infoText:       { fontSize: 14, color: '#374151' },
  progressBox:    { borderLeftWidth: 3, borderRadius: 8, padding: 12, marginBottom: 16 },
  progressText:   { fontSize: 13 },
  publishBtn:     { backgroundColor: '#16a34a', borderRadius: 12, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, elevation: 3, shadowColor: '#16a34a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4 },
  publishBtnDisabled: { backgroundColor: '#86efac', elevation: 0 },
  publishBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  doneBtn:        { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  backBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, marginTop: 8 },
  backBtnText:    { color: '#6b7280', fontSize: 14 },
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet:     { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 34 },
  modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalTitle:     { fontSize: 18, fontWeight: '700', color: '#111827' },
  catOption:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  catOptionSelected:     { backgroundColor: '#eff6ff' },
  catOptionText:         { fontSize: 16, color: '#374151' },
  catOptionTextSelected: { color: '#2563eb', fontWeight: '600' },
});
