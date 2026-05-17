import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Image, ActivityIndicator, SafeAreaView, Modal, Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getSettings } from '../services/storageService';
import {
  fetchRecentProducts,
  searchProducts,
  setOutOfStock,
  updateProductPrice,
  updateProductDescription,
  unpublishProduct,
  republishProduct,
  deleteProduct,
} from '../services/woocommerceService';

const STATUS_LABEL = {
  publish:  { label: 'Publie',    bg: '#dcfce7', text: '#15803d', icon: 'eye-outline' },
  draft:    { label: 'Brouillon', bg: '#fef9c3', text: '#a16207', icon: 'eye-off-outline' },
  pending:  { label: 'En attente',bg: '#e0f2fe', text: '#0369a1', icon: 'time-outline' },
};

const ProductRow = ({ product, onPress }) => {
  const st = STATUS_LABEL[product.status] || STATUS_LABEL.draft;
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      {product.thumbnail
        ? <Image source={{ uri: product.thumbnail }} style={styles.thumb} />
        : <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <Ionicons name="image-outline" size={24} color="#d1d5db" />
          </View>
      }
      <View style={styles.rowInfo}>
        <Text style={styles.rowName} numberOfLines={1}>{product.name}</Text>
        <Text style={styles.rowPrice}>{parseFloat(product.price).toFixed(2)} EUR</Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
        <Ionicons name={st.icon} size={12} color={st.text} />
        <Text style={[styles.statusText, { color: st.text }]}>{st.label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#d1d5db" style={{ marginLeft: 4 }} />
    </TouchableOpacity>
  );
};

// ErrorBoundary pour attraper les erreurs de rendu
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { err: null }; }
  static getDerivedStateFromError(e) { return { err: String(e) }; }
  render() {
    if (this.state.err) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#fff' }}>
          <Text style={{ color: 'red', fontWeight: 'bold', marginBottom: 8 }}>Erreur de rendu</Text>
          <Text style={{ color: '#333', fontSize: 11, textAlign: 'center' }}>{this.state.err}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function ManageProductsScreen({ navigation }) {
  const [settings, setSettings] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [showPanel, setShowPanel] = useState(false);
  const [correctPrice, setCorrectPrice] = useState('');
  const [correctDescription, setCorrectDescription] = useState('');
  const [actioning, setActioning] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [hookError, setHookError] = useState(null);

  const loadedOnceRef = useRef(false);
  const suppressNextFocusRef = useRef(false);
  const lastFocusTimeRef = useRef(0);

  const loadProducts = useCallback(async (s, silent = false) => {
    try {
      loadedOnceRef.current = true;
      if (!silent) setLoading(true);
      setError(null);
      const list = await fetchRecentProducts(s || settings);
      setProducts(prev => (list && list.length > 0) ? list : prev);
    } catch (e) {
      setError(e.message || 'Erreur chargement');
    } finally {
      setLoading(false);
    }
  }, [settings]);

  useFocusEffect(
    useCallback(() => {
      try {
        if (suppressNextFocusRef.current) {
          suppressNextFocusRef.current = false;
          return;
        }
        const now = Date.now();
        if (now - lastFocusTimeRef.current < 5000) return;
        lastFocusTimeRef.current = now;
        getSettings().then((s) => {
          try {
            setSettings(prev => {
              if (!prev) return s;
              try { if (JSON.stringify(prev) === JSON.stringify(s)) return prev; } catch(e) {}
              return s;
            });
            loadProducts(s, loadedOnceRef.current);
          } catch (innerErr) {
            setHookError('focus-then: ' + String(innerErr));
          }
        }).catch((err) => {
          setHookError('getSettings: ' + String(err));
          setLoading(false);
        });
      } catch (outerErr) {
        setHookError('focus: ' + String(outerErr));
      }
    }, [])
  );

  const openPanel = (product) => {
    setSelected(product);
    setCorrectPrice(product.price);
    setCorrectDescription(product.short_description || '');
    setActionMsg(null);
    setShowPanel(true);
  };

  const closePanel = () => {
    suppressNextFocusRef.current = true;
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
    if (!p || p <= 0) {
      setActionMsg({ ok: false, msg: 'Prix invalide.' });
      return;
    }
    setActioning(true);
    try {
      await updateProductPrice(selected.id, p, settings);
      updateLocalProduct(selected.id, { price: p.toFixed(2) });
      setActionMsg({ ok: true, msg: 'Prix mis a jour : ' + p.toFixed(2) + ' EUR' });
    } catch (e) {
      setActionMsg({ ok: false, msg: 'Erreur: ' + e.message });
    } finally {
      setActioning(false);
    }
  };

  const handleCorrectDescription = async () => {
    setActioning(true);
    try {
      await updateProductDescription(selected.id, correctDescription.trim(), settings);
      updateLocalProduct(selected.id, { short_description: correctDescription.trim() });
      setActionMsg({ ok: true, msg: 'Description mise a jour.' });
    } catch (e) {
      setActionMsg({ ok: false, msg: 'Erreur: ' + e.message });
    } finally {
      setActioning(false);
    }
  };


  const handleTogglePublish = async () => {
    const productId = selected.id;
    const isPublished = selected.status === 'publish';
    const newSt = isPublished ? 'draft' : 'publish';
    setActioning(true);
    try {
      if (isPublished) {
        await unpublishProduct(productId, settings);
      } else {
        await republishProduct(productId, settings);
      }
      suppressNextFocusRef.current = true;
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, status: newSt } : p));
      setShowPanel(false);
      setSelected(null);
      setActionMsg(null);
    } catch (e) {
      setActionMsg({ ok: false, msg: 'Erreur: ' + e.message });
    } finally {
      setActioning(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await searchProducts(searchQuery.trim(), settings);
      setSearchResults(results);
    } catch (e) {
      setSearchResults([]);
      setActionMsg({ ok: false, msg: 'Erreur recherche: ' + e.message });
    } finally {
      setSearching(false);
    }
  };

  const handleSetOutOfStock = async () => {
    setActioning(true);
    try {
      await setOutOfStock(selected.id, settings);
      removeLocalProduct(selected.id);
      if (searchResults !== null) {
        setSearchResults(prev => prev.filter(p => p.id !== selected.id));
      }
      closePanel();
    } catch (e) {
      setActionMsg({ ok: false, msg: 'Erreur: ' + e.message });
    } finally {
      setActioning(false);
    }
  };

  const handleDelete = async () => {
    setActioning(true);
    try {
      await deleteProduct(selected.id, settings);
      removeLocalProduct(selected.id);
      closePanel();
    } catch (e) {
      setActionMsg({ ok: false, msg: 'Erreur: ' + e.message });
    } finally {
      setActioning(false);
    }
  };

  // Si une erreur de hook est detectee, on l'affiche
  if (hookError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Text style={{ color: 'red', fontWeight: 'bold', fontSize: 16, marginBottom: 12 }}>Erreur hook</Text>
          <Text style={{ color: '#333', fontSize: 12, textAlign: 'center', marginBottom: 20 }}>{hookError}</Text>
          <TouchableOpacity
            style={{ backgroundColor: '#2563eb', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}
            onPress={() => { setHookError(null); setLoading(true); getSettings().then(s => loadProducts(s)).catch(() => setLoading(false)); }}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Reessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerCount}>
            {loading ? 'Chargement...' : products.length + ' produit' + (products.length > 1 ? 's' : '')}
          </Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => loadProducts()} disabled={loading}>
            {loading ? <ActivityIndicator size="small" color="#2563eb" /> : <Ionicons name="refresh-outline" size={20} color="#2563eb" />}
          </TouchableOpacity>
        </View>

        {/* Erreurs */}
        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color="#be123c" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        {!loading && !error && products.length === 0 && (
          <View style={styles.emptyBox}>
            <Ionicons name="cube-outline" size={40} color="#d1d5db" />
            <Text style={styles.emptyText}>Aucun produit trouve</Text>
          </View>
        )}

        {/* Barre de recherche */}
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher par nom..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={searching}>
            {searching ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.searchBtnText}>Chercher</Text>}
          </TouchableOpacity>
        </View>

        {searchResults !== null && (
          <View style={styles.searchResultsBox}>
            <View style={styles.searchResultsHeader}>
              <Text style={styles.searchResultsTitle}>
                {searchResults.length === 0 ? 'Aucun resultat' : searchResults.length + ' resultat(s)'}
              </Text>
              <TouchableOpacity onPress={() => setSearchResults(null)}>
                <Text style={styles.searchClearBtn}>Effacer</Text>
              </TouchableOpacity>
            </View>
            {searchResults.map(product => (
              <TouchableOpacity key={product.id} style={styles.productRow} onPress={() => openPanel(product)}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                  <Text style={styles.productMeta}>{'#' + product.id + ' - ' + product.price + ' EUR'}</Text>
                </View>
                <Text style={[styles.srStatusBadge, product.stock_status === 'outofstock' ? styles.statusOut : styles.statusIn]}>
                  {product.stock_status === 'outofstock' ? 'Rupture' : 'En stock'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {loading && products.length === 0 ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingCenterText}>Chargement des produits...</Text>
          </View>
        ) : !loading && products.length === 0 ? (
          <View style={styles.loadingCenter}>
            <Text style={styles.loadingCenterText}>{error ? error : 'Aucun produit trouve'}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => getSettings().then(s => loadProducts(s)).catch(() => {})}
            >
              <Text style={styles.retryBtnText}>Recharger</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView style={styles.list}>
            {products.map((p) => <ProductRow key={p.id} product={p} onPress={() => openPanel(p)} />)}
          </ScrollView>
        )}

        {/* Panneau d'actions (modal) */}
        <Modal visible={showPanel && !!selected} transparent animationType="none" onRequestClose={closePanel}>
          <View style={styles.modalOverlay}>
            <View style={styles.panel}>
              {/* En-tete du panneau */}
              <View style={styles.panelHeader}>
                {selected && (selected.thumbnail || (selected.images && selected.images.length > 0 && selected.images[0]))
                  ? <Image source={{ uri: selected.thumbnail || selected.images[0].src }} style={styles.panelThumb} resizeMode="cover" />
                  : null}
                <View style={{ flex: 1 }}>
                  <Text style={styles.panelTitle} numberOfLines={1}>{selected?.name}</Text>
                  <Text style={styles.panelSub}>ID #{selected?.id}</Text>
                </View>
                <View style={styles.panelHeaderRight}>
                  <TouchableOpacity onPress={closePanel} style={styles.closeBtn}>
                    <Ionicons name="close" size={22} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.divider} />

              {/* Message resultat */}
              {actionMsg && (
                <View style={[styles.actionMsg, actionMsg.ok ? styles.actionMsgOk : styles.actionMsgErr]}>
                  <Text style={[styles.actionMsgText, actionMsg.ok ? styles.actionMsgTextOk : styles.actionMsgTextErr]}>
                    {actionMsg.msg}
                  </Text>
                </View>
              )}

              {/* Corriger le prix */}
              <Text style={styles.actionLabel}>Corriger le prix</Text>
              <View style={styles.priceRow}>
                <TextInput
                  style={styles.priceInput}
                  value={correctPrice}
                  onChangeText={setCorrectPrice}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor="#9ca3af"
                />
                <Text style={styles.euroSign}>EUR</Text>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnBlue, actioning && styles.disabled]}
                  onPress={handleCorrectPrice}
                  disabled={actioning}
                >
                  {actioning ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.actionBtnText}>Mettre a jour</Text>}
                </TouchableOpacity>
              </View>
              <View style={styles.divider} />

            {/* Modifier la description */}
            <Text style={styles.actionLabel}>Description courte</Text>
            <View style={{ alignSelf: 'stretch' }}>
            <TextInput
              style={{ minHeight: 80, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 15, color: '#111827', textAlignVertical: 'top', marginBottom: 10 }}
              value={correctDescription}
              onChangeText={setCorrectDescription}
              placeholder="Description du produit..."
              placeholderTextColor="#9ca3af"
              multiline
            />
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnBlue, actioning && styles.disabled]}
              onPress={handleCorrectDescription}
              disabled={actioning}
            >
              {actioning ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.actionBtnText}>Mettre a jour la description</Text>}
            </TouchableOpacity>
            <View style={styles.divider} />

              {selected && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnSlate, actioning && styles.actionBtnDisabled]}
                  onPress={handleTogglePublish}
                  disabled={actioning}>
                  {actioning ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.actionBtnText}>{selected.status === 'publish' ? 'Depublier' : 'Republier'}</Text>}
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.actionBtn, styles.outOfStockBtn, actioning && styles.actionBtnDisabled]}
                onPress={handleSetOutOfStock}
                disabled={actioning}
              >
                {actioning ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.actionBtnText}>Rupture de stock</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnRed, actioning && styles.actionBtnDisabled]}
                onPress={handleDelete}
                disabled={actioning}>
                {actioning ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.actionBtnText}>Supprimer definitivement</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  headerCount: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  refreshBtn: { padding: 6 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 16, padding: 12, backgroundColor: '#fff1f2', borderRadius: 10, borderLeftWidth: 3, borderLeftColor: '#e11d48' },
  errorText: { flex: 1, fontSize: 13, color: '#be123c' },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, color: '#9ca3af' },
  list: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', gap: 12 },
  thumb: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#f3f4f6' },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  rowInfo: { flex: 1, gap: 4 },
  rowName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  rowPrice: { fontSize: 14, color: '#2563eb', fontWeight: '700' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  panel: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 16, paddingBottom: 34, paddingTop: 8 },
  panelHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  panelThumb: { width: 72, height: 72, borderRadius: 8, marginRight: 10 },
  panelTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  panelSub: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  panelHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  closeBtn: { padding: 4 },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 12 },
  actionMsg: { borderRadius: 8, padding: 10, marginBottom: 10, borderLeftWidth: 3 },
  actionMsgOk: { backgroundColor: '#f0fdf4', borderLeftColor: '#16a34a' },
  actionMsgErr: { backgroundColor: '#fff1f2', borderLeftColor: '#e11d48' },
  actionMsgText: { fontSize: 13 },
  actionMsgTextOk: { color: '#15803d' },
  actionMsgTextErr: { color: '#be123c' },
  actionLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  priceInput: { width: 90, flexShrink: 1, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, fontSize: 18, fontWeight: '700', color: '#111827', textAlign: 'center' },
  euroSign: { fontSize: 18, color: '#6b7280', fontWeight: '600' },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  actionBtnBlue: { backgroundColor: '#2563eb' },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  disabled: { opacity: 0.5 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, paddingBottom: 6 },
  searchInput: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 10, padding: 10, fontSize: 15, borderWidth: 1, borderColor: '#e5e7eb' },
  searchBtn: { backgroundColor: '#6366f1', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  searchResultsBox: { marginHorizontal: 12, marginBottom: 8, backgroundColor: '#f9fafb', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden' },
  searchResultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, backgroundColor: '#ede9fe' },
  searchResultsTitle: { fontWeight: '700', color: '#4f46e5', fontSize: 13 },
  searchClearBtn: { color: '#6b7280', fontSize: 13, fontWeight: '600' },
  outOfStockBtn: { backgroundColor: '#f59e0b', marginTop: 12 },
  actionBtnSlate: { backgroundColor: '#64748b' },
  actionBtnRed: { backgroundColor: '#ef4444', marginTop: 12 },
  actionBtnDisabled: { opacity: 0.5 },
  srStatusBadge: { fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusIn: { backgroundColor: '#d1fae5', color: '#065f46' },
  statusOut: { backgroundColor: '#fee2e2', color: '#991b1b' },
  productRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  productInfo: { flex: 1 },
  productName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  productMeta: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingCenterText: { fontSize: 14, color: '#6b7280', marginTop: 12 },
  retryBtn: { marginTop: 16, backgroundColor: '#2563eb', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryBtnText: { color: '#fff', fontWeight: '600' },
});
