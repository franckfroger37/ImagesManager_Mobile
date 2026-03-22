import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Image, ActivityIndicator, SafeAreaView, Modal, Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getSettings, CATEGORIES } from '../services/storageService';
import { processImage, generateRefName, getFileSize } from '../services/imageService';
import {
  publishProduct, fetchCategories,
  updateProductPrice, unpublishProduct, deleteProduct,
} from '../services/woocommerceService';

export default function PublishScreen({ route, navigation }) {
  const { uri, fileName, cropParams } = route.params;

  const [price, setPrice] = useState('');
  const [categories, setCategories] = useState(CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressType, setProgressType] = useState('info');
  const [settings, setSettings] = useState(null);
  const [refName] = useState(() => generateRefName(fileName));

  // État post-publication
  const [publishedProduct, setPublishedProduct] = useState(null); // {id, permalink}
  const [correctPrice, setCorrectPrice] = useState('');
  const [postActionMsg, setPostActionMsg] = useState(null); // {ok, msg}
  const [postActioning, setPostActioning] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getSettings().then(async (s) => {
        setSettings(s);
        const wooCats = await fetchCategories(s);
        if (wooCats && wooCats.length > 0) {
          setCategories(wooCats);
          const defaultCat =
            wooCats.find((c) => c.value === s.defaultCategory) ||
            wooCats.find((c) => c.value === selectedCategory.value) ||
            wooCats[0];
          setSelectedCategory(defaultCat);
        } else {
          setCategories(CATEGORIES);
          const defaultCat = CATEGORIES.find((c) => c.value === s.defaultCategory) || CATEGORIES[0];
          setSelectedCategory(defaultCat);
        }
      });
    }, [])
  );

  const settingsOk = settings?.wooUrl && settings?.consumerKey && settings?.consumerSecret;

  const setMsg = (msg, type = 'info') => { setProgressMsg(msg); setProgressType(type); };

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
    setPublishedProduct(null);
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
        categoryId:    selectedCategory.id || null,
        settings,
        onProgress: (msg) => setMsg(msg, 'info'),
      });

      setProcessing(false);
      setPublishedProduct(result); // {id, permalink}
      setCorrectPrice(price);
      setPostActionMsg(null);
      setMsg(`✅ Produit "${refName}" publié avec succès !`, 'success');
    } catch (error) {
      setProcessing(false);
      setMsg(`❌ Erreur : ${error.message || 'Une erreur est survenue.'}`, 'error');
    }
  };

  // ── Actions post-publication ────────────────────────────────────────────────

  const handleCorrectPrice = async () => {
    const p = parseFloat(correctPrice);
    if (!p || p <= 0) {
      setPostActionMsg({ ok: false, msg: '⚠️ Prix invalide.' });
      return;
    }
    setPostActioning(true);
    try {
      await updateProductPrice(publishedProduct.id, p, settings);
      setPostActionMsg({ ok: true, msg: `✅ Prix mis à jour : ${p.toFixed(2)} €` });
    } catch (e) {
      setPostActionMsg({ ok: false, msg: `❌ ${e.message}` });
    } finally { setPostActioning(false); }
  };

  const handleUnpublish = async () => {
    setPostActioning(true);
    try {
      await unpublishProduct(publishedProduct.id, settings);
      setPostActionMsg({ ok: true, msg: '✅ Produit dépublié (brouillon). Il n\'apparaît plus dans la boutique.' });
    } catch (e) {
      setPostActionMsg({ ok: false, msg: `❌ ${e.message}` });
    } finally { setPostActioning(false); }
  };

  const handleDeleteAndRestart = async () => {
    setPostActioning(true);
    try {
      await deleteProduct(publishedProduct.id, settings);
      // Retour à l'écran de recadrage avec les mêmes paramètres
      navigation.goBack();
    } catch (e) {
      setPostActionMsg({ ok: false, msg: `❌ Suppression échouée : ${e.message}` });
      setPostActioning(false);
    }
  };

  const handleOpenSite = () => {
    if (publishedProduct?.permalink) {
      Linking.openURL(publishedProduct.permalink);
    }
  };

  // ── Couleurs messages ───────────────────────────────────────────────────────
  const pc = {
    info:    { bg: '#eff6ff', border: '#3b82f6', text: '#1d4ed8' },
    error:   { bg: '#fff1f2', border: '#e11d48', text: '#be123c' },
    success: { bg: '#f0fdf4', border: '#16a34a', text: '#15803d' },
  }[progressType] || { bg: '#eff6ff', border: '#3b82f6', text: '#1d4ed8' };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* ── Aperçu photo ── */}
        <View style={styles.previewCard}>
          <Image source={{ uri }} style={styles.preview} resizeMode="cover" />
          <View style={styles.previewInfo}>
            <Text style={styles.refName}>{refName}</Text>
            <Text style={styles.refSub}>Photo originale</Text>
          </View>
        </View>

        {/* ── Bannière settings manquants ── */}
        {settings && !settingsOk && (
          <TouchableOpacity style={styles.warningBanner} onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="warning-outline" size={18} color="#92400e" />
            <Text style={styles.warningText}>Paramètres WooCommerce non configurés — tapez ici</Text>
            <Ionicons name="chevron-forward" size={16} color="#92400e" />
          </TouchableOpacity>
        )}

        {/* ── Formulaire (masqué après publication) ── */}
        {!publishedProduct && (
          <>
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
          </>
        )}

        {/* ── Message de progression ── */}
        {progressMsg ? (
          <View style={[styles.progressBox, { backgroundColor: pc.bg, borderLeftColor: pc.border }]}>
            <Text style={[styles.progressText, { color: pc.text }]}>{progressMsg}</Text>
          </View>
        ) : null}

        {/* ── Bouton publier ── */}
        {!publishedProduct && (
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

        {/* ── Panneau actions post-publication ── */}
        {publishedProduct && (
          <View style={styles.postCard}>
            <View style={styles.postHeader}>
              <Ionicons name="checkmark-circle" size={28} color="#16a34a" />
              <View style={{ flex: 1 }}>
                <Text style={styles.postTitle}>Produit publié</Text>
                <Text style={styles.postSub}>ID #{publishedProduct.id} · {refName}</Text>
              </View>
              {publishedProduct.permalink ? (
                <TouchableOpacity style={styles.viewBtn} onPress={handleOpenSite}>
                  <Ionicons name="eye-outline" size={16} color="#2563eb" />
                  <Text style={styles.viewBtnText}>Voir</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.divider} />

            {/* Corriger le prix */}
            <Text style={styles.actionLabel}>✏️ Corriger le prix</Text>
            <View style={styles.priceRow}>
              <TextInput
                style={styles.priceCorrectInput}
                value={correctPrice}
                onChangeText={setCorrectPrice}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#9ca3af"
              />
              <Text style={styles.euroSign}>€</Text>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnBlue, postActioning && styles.actionBtnDisabled]}
                onPress={handleCorrectPrice}
                disabled={postActioning}
              >
                {postActioning
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.actionBtnText}>Mettre à jour</Text>}
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* Message résultat action */}
            {postActionMsg && (
              <View style={[styles.postActionMsg,
                postActionMsg.ok ? styles.postActionMsgOk : styles.postActionMsgErr]}>
                <Text style={[styles.postActionMsgText,
                  postActionMsg.ok ? styles.postActionMsgTextOk : styles.postActionMsgTextErr]}>
                  {postActionMsg.msg}
                </Text>
              </View>
            )}

            {/* Dépublier */}
            <TouchableOpacity
              style={[styles.actionRow, postActioning && styles.actionBtnDisabled]}
              onPress={handleUnpublish}
              disabled={postActioning}
            >
              <Ionicons name="eye-off-outline" size={20} color="#d97706" />
              <View style={{ flex: 1 }}>
                <Text style={styles.actionRowTitle}>🚫 Dépublier</Text>
                <Text style={styles.actionRowSub}>Passe en brouillon — invisible dans la boutique</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#d97706" />
            </TouchableOpacity>

            {/* Supprimer et recommencer */}
            <TouchableOpacity
              style={[styles.actionRow, styles.actionRowDanger, postActioning && styles.actionBtnDisabled]}
              onPress={handleDeleteAndRestart}
              disabled={postActioning}
            >
              <Ionicons name="trash-outline" size={20} color="#dc2626" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionRowTitle, { color: '#dc2626' }]}>🗑️ Supprimer et recommencer</Text>
                <Text style={styles.actionRowSub}>Supprime le produit · retour au recadrage</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#dc2626" />
            </TouchableOpacity>

            {/* Nouveau produit */}
            <TouchableOpacity style={styles.newProductBtn} onPress={() => navigation.navigate('Home')}>
              <Ionicons name="home-outline" size={20} color="#fff" />
              <Text style={styles.newProductBtnText}>🏠 Nouveau produit</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Retour recadrage (avant publication) ── */}
        {!publishedProduct && (
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} disabled={processing}>
            <Ionicons name="crop-outline" size={18} color="#6b7280" />
            <Text style={styles.backBtnText}>Modifier le recadrage</Text>
          </TouchableOpacity>
        )}

      </ScrollView>

      {/* ── Sélecteur catégorie ── */}
      <Modal visible={showCategoryPicker} transparent animationType="slide" onRequestClose={() => setShowCategoryPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choisir une catégorie</Text>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            {categories.map((cat) => (
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
  scroll:         { padding: 16, paddingBottom: 120 },
  previewCard:    { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  preview:        { width: 80, height: 80 },
  previewInfo:    { flex: 1, padding: 12, justifyContent: 'center' },
  refName:        { fontSize: 16, fontWeight: '700', color: '#111827' },
  refSub:         { fontSize: 12, color: '#6b7280', marginTop: 2 },
  warningBanner:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fbbf24', borderRadius: 10, padding: 12, marginBottom: 12 },
  warningText:    { flex: 1, fontSize: 13, color: '#92400e', fontWeight: '500' },
  section:        { marginBottom: 16 },
  sectionLabel:   { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.3 },
  priceInput:     { backgroundColor: '#fff', borderRadius: 10, borderWidth: 2, borderColor: '#2563eb', padding: 10, fontSize: 18, fontWeight: '700', color: '#111827', textAlign: 'center' },
  categorySelector:     { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categorySelectorText: { fontSize: 16, color: '#111827', fontWeight: '500' },
  infoRow:        { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  infoText:       { fontSize: 14, color: '#374151' },
  progressBox:    { borderLeftWidth: 3, borderRadius: 8, padding: 12, marginBottom: 16 },
  progressText:   { fontSize: 13 },
  publishBtn:         { backgroundColor: '#16a34a', borderRadius: 12, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, elevation: 3, shadowColor: '#16a34a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4 },
  publishBtnDisabled: { backgroundColor: '#86efac', elevation: 0 },
  publishBtnText:     { color: '#fff', fontSize: 17, fontWeight: '700' },
  backBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, marginTop: 8 },
  backBtnText:    { color: '#6b7280', fontSize: 14 },

  // Post-publication
  postCard:       { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#d1fae5', elevation: 2 },
  postHeader:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  postTitle:      { fontSize: 16, fontWeight: '700', color: '#15803d' },
  postSub:        { fontSize: 12, color: '#6b7280', marginTop: 2 },
  viewBtn:        { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  viewBtnText:    { fontSize: 13, color: '#2563eb', fontWeight: '600' },
  divider:        { height: 1, backgroundColor: '#f3f4f6', marginVertical: 12 },
  actionLabel:    { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  priceRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  priceCorrectInput: { flex: 1, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, fontSize: 18, fontWeight: '700', color: '#111827', textAlign: 'center' },
  euroSign:       { fontSize: 18, color: '#6b7280', fontWeight: '600' },
  actionBtn:      { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  actionBtnBlue:  { backgroundColor: '#2563eb' },
  actionBtnDisabled: { opacity: 0.5 },
  actionBtnText:  { color: '#fff', fontWeight: '700', fontSize: 13 },
  postActionMsg:      { borderRadius: 8, padding: 10, marginBottom: 8, borderLeftWidth: 3 },
  postActionMsgOk:    { backgroundColor: '#f0fdf4', borderLeftColor: '#16a34a' },
  postActionMsgErr:   { backgroundColor: '#fff1f2', borderLeftColor: '#e11d48' },
  postActionMsgText:  { fontSize: 13 },
  postActionMsgTextOk:  { color: '#15803d' },
  postActionMsgTextErr: { color: '#be123c' },
  actionRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  actionRowDanger:{ borderTopWidth: 1, borderTopColor: '#fee2e2' },
  actionRowTitle: { fontSize: 14, fontWeight: '600', color: '#d97706' },
  actionRowSub:   { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  newProductBtn:  { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8 },
  newProductBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Modal catégories
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet:     { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 34 },
  modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalTitle:     { fontSize: 18, fontWeight: '700', color: '#111827' },
  catOption:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  catOptionSelected:     { backgroundColor: '#eff6ff' },
  catOptionText:         { fontSize: 16, color: '#374151' },
  catOptionTextSelected: { color: '#2563eb', fontWeight: '600' },
});
