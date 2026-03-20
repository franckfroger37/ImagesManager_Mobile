import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Image, ActivityIndicator, SafeAreaView, Modal, Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getSettings } from '../services/storageService';
import {
  fetchRecentProducts,
  updateProductPrice,
  unpublishProduct,
  republishProduct,
  deleteProduct,
} from '../services/woocommerceService';

const STATUS_LABEL = {
  publish: { label: 'Publié',    bg: '#dcfce7', text: '#15803d', icon: 'eye-outline' },
  draft:   { label: 'Brouillon', bg: '#fef9c3', text: '#a16207', icon: 'eye-off-outline' },
  pending: { label: 'En attente', bg: '#e0f2fe', text: '#0369a1', icon: 'time-outline' },
};

export default function ManageProductsScreen({ navigation }) {
  const [settings,  setSettings]  = useState(null);
  const [products,  setProducts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  const [selected,     setSelected]     = useState(null);
  const [showPanel,    setShowPanel]    = useState(false);
  const [correctPrice, setCorrectPrice] = useState('');
  const [actioning,    setActioning]    = useState(false);
  const [actionMsg,    setActionMsg]    = useState(null);

  const loadProducts = useCallback(async (s) => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchRecentProducts(s || settings);
      setProducts(list);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [settings]);

  useFocusEffect(
    useCallback(() => {
      getSettings().then((s) => {
        setSettings(s);
        loadProducts(s);
      });
    }, [])
  );

  const openPanel = (product) => {
    setSelected(product);
    setCorrectPrice(product.price);
    setActionMsg(null);
    setShowPanel(true);
  };

  const closePanel = () => {
    setShowPanel(false);
    setSelected(null);
    setActionMsg(null);
  };

  const updateLocalProduct = (id, changes) => {
    setProducts((prev) => prev.map((p) => p.id === id ? { ...p, ...changes } : p));
    setSelected((prev) => prev ? { ...prev, ...changes } : prev);
  };

  const removeLocalProduct = (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    closePanel();
  };

  const handleCorrectPrice = async () => {
    const p = parseFloat(correctPrice);
    if (!p || p <= 0) { setActionMsg({ ok: false, msg: '⚠️ Prix invalide.' }); return; }
    setActioning(true);
    try {
      await updateProductPrice(selected.id, p, settings);
      updateLocalProduct(selected.id, { price: p.toFixed(2) });
      setActionMsg({ ok: true, msg: `✅ Prix mis à jour : ${p.toFixed(2)} €` });
    } catch (e) {
      setActionMsg({ ok: false, msg: `❌ ${e.message}` });
    } finally { setActioning(false); }
  };

  const handleTogglePublish = async () => {
    const isPublished = selected.status === 'publish';
    setActioning(true);
    try {
      if (isPublished) {
        await unpublishProduct(selected.id, settings);
        updateLocalProduct(selected.id, { status: 'draft' });
        setActionMsg({ ok: true, msg: '✅ Produit dépublié.' });
      } else {
        await republishProduct(selected.id, settings);
        updateLocalProduct(selected.id, { status: 'publish' });
        setActionMsg({ ok: true, msg: '✅ Produit republié — visible dans la boutique.' });
      }
    } catch (e) {
      setActionMsg({ ok: false, msg: `❌ ${e.message}` });
    } finally { setActioning(false); }
  };

  const handleDelete = async () => {
    setActioning(true);
    try {
      await deleteProduct(selected.id, settings);
      removeLocalProduct(selected.id);
    } catch (e) {
      setActionMsg({ ok: false, msg: `❌ ${e.message}` });
      setActioning(false);
    }
  };

  const handleOpenSite = () => {
    if (selected?.permalink) Linking.openURL(selected.permalink);
  };

  const ProductRow = ({ product }) => {
    const st = STATUS_LABEL[product.status] || STATUS_LABEL.draft;
    return (
      <TouchableOpacity style={styles.row} onPress={() => openPanel(product)}>
        {product.thumbnail
          ? <Image source={{ uri: product.thumbnail }} style={styles.thumb} />
          : <View style={[styles.thumb, styles.thumbPlaceholder]}>
              <Ionicons name="image-outline" size={24} color="#d1d5db" />
            </View>
        }
        <View style={styles.rowInfo}>
          <Text style={styles.rowName} numberOfLines={1}>{product.name}</Text>
          <Text style={styles.rowPrice}>{parseFloat(product.price).toFixed(2)} €</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
          <Ionicons name={st.icon} size={12} color={st.text} />
          <Text style={[styles.statusText, { color: st.text }]}>{st.label}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#d1d5db" style={{ marginLeft: 4 }} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerCount}>
          {loading ? 'Chargement...' : `${products.length} produit${products.length > 1 ? 's' : ''}`}
        </Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => loadProducts()} disabled={loading}>
          {loading
            ? <ActivityIndicator size="small" color="#2563eb" />
            : <Ionicons name="refresh-outline" size={20} color="#2563eb" />}
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={18} color="#be123c" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!loading && !error && products.length === 0 && (
        <View style={styles.emptyBox}>
          <Ionicons name="cube-outline" size={40} color="#d1d5db" />
          <Text style={styles.emptyText}>Aucun produit trouvé</Text>
        </View>
      )}

      <ScrollView style={styles.list}>
        {products.map((p) => <ProductRow key={p.id} product={p} />)}
      </ScrollView>

      <Modal visible={showPanel} transparent animationType="slide" onRequestClose={closePanel}>
        <View style={styles.modalOverlay}>
          <View style={styles.panel}>

            <View style={styles.panelHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.panelTitle} numberOfLines={1}>{selected?.name}</Text>
                <Text style={styles.panelSub}>ID #{selected?.id}</Text>
              </View>
              <View style={styles.panelHeaderRight}>
                {selected?.permalink && (
                  <TouchableOpacity style={styles.viewBtn} onPress={handleOpenSite}>
                    <Ionicons name="eye-outline" size={15} color="#2563eb" />
                    <Text style={styles.viewBtnText}>Voir</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={closePanel} style={styles.closeBtn}>
                  <Ionicons name="close" size={22} color="#6b7280" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.divider} />

            {actionMsg && (
              <View style={[styles.actionMsg, actionMsg.ok ? styles.actionMsgOk : styles.actionMsgErr]}>
                <Text style={[styles.actionMsgText, actionMsg.ok ? styles.actionMsgTextOk : styles.actionMsgTextErr]}>
                  {actionMsg.msg}
                </Text>
              </View>
            )}

            {/* Corriger le prix — input compact + bouton bien visible */}
            <Text style={styles.actionLabel}>✏️ Corriger le prix</Text>
            <View style={styles.priceRow}>
              <TextInput
                style={styles.priceInput}
                value={correctPrice}
                onChangeText={setCorrectPrice}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#9ca3af"
              />
              <Text style={styles.euroSign}>€</Text>
              <TouchableOpacity
                style={[styles.updateBtn, actioning && styles.disabled]}
                onPress={handleCorrectPrice}
                disabled={actioning}
              >
                {actioning
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.updateBtnText}>Mettre à jour</Text>}
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {selected && (
              <TouchableOpacity
                style={[styles.bigAction, actioning && styles.disabled]}
                onPress={handleTogglePublish}
                disabled={actioning}
              >
                <Ionicons
                  name={selected.status === 'publish' ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color={selected.status === 'publish' ? '#d97706' : '#16a34a'}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.bigActionTitle, {
                    color: selected.status === 'publish' ? '#d97706' : '#16a34a'
                  }]}>
                    {selected.status === 'publish' ? '🚫 Dépublier' : '✅ Republier'}
                  </Text>
                  <Text style={styles.bigActionSub}>
                    {selected.status === 'publish'
                      ? 'Passe en brouillon — invisible dans la boutique'
                      : 'Remet en ligne — visible dans la boutique'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.bigAction, styles.bigActionDanger, actioning && styles.disabled]}
              onPress={handleDelete}
              disabled={actioning}
            >
              <Ionicons name="trash-outline" size={22} color="#dc2626" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.bigActionTitle, { color: '#dc2626' }]}>🗑️ Supprimer définitivement</Text>
                <Text style={styles.bigActionSub}>Supprime le produit et son image</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#fca5a5" />
            </TouchableOpacity>

          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f8fafc' },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  headerCount:  { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  refreshBtn:   { padding: 6 },
  errorBox:     { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 16, padding: 12, backgroundColor: '#fff1f2', borderRadius: 10, borderLeftWidth: 3, borderLeftColor: '#e11d48' },
  errorText:    { flex: 1, fontSize: 13, color: '#be123c' },
  emptyBox:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText:    { fontSize: 15, color: '#9ca3af' },
  list:         { flex: 1 },
  row:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', gap: 12 },
  thumb:        { width: 56, height: 56, borderRadius: 8, backgroundColor: '#f3f4f6' },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  rowInfo:      { flex: 1, gap: 4 },
  rowName:      { fontSize: 14, fontWeight: '600', color: '#111827' },
  rowPrice:     { fontSize: 14, color: '#2563eb', fontWeight: '700' },
  statusBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  statusText:   { fontSize: 11, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  panel:        { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 16, paddingBottom: 34, paddingTop: 8 },
  panelHeader:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  panelTitle:   { fontSize: 16, fontWeight: '700', color: '#111827' },
  panelSub:     { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  panelHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  viewBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  viewBtnText:  { fontSize: 13, color: '#2563eb', fontWeight: '600' },
  closeBtn:     { padding: 4 },
  divider:      { height: 1, backgroundColor: '#f3f4f6', marginVertical: 12 },
  actionMsg:    { borderRadius: 8, padding: 10, marginBottom: 10, borderLeftWidth: 3 },
  actionMsgOk:  { backgroundColor: '#f0fdf4', borderLeftColor: '#16a34a' },
  actionMsgErr: { backgroundColor: '#fff1f2', borderLeftColor: '#e11d48' },
  actionMsgText:    { fontSize: 13 },
  actionMsgTextOk:  { color: '#15803d' },
  actionMsgTextErr: { color: '#be123c' },
  actionLabel:  { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },

  // Ligne prix : input compact à gauche, bouton bien visible à droite
  priceRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  priceInput:   { width: 90, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 8, fontSize: 16, fontWeight: '700', color: '#111827', textAlign: 'center' },
  euroSign:     { fontSize: 16, color: '#6b7280', fontWeight: '600' },
  updateBtn:    { flex: 1, backgroundColor: '#2563eb', borderRadius: 8, paddingVertical: 11, alignItems: 'center', justifyContent: 'center' },
  updateBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  bigAction:    { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  bigActionDanger: { borderTopColor: '#fee2e2' },
  bigActionTitle: { fontSize: 14, fontWeight: '600' },
  bigActionSub:   { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  disabled:     { opacity: 0.5 },
});
