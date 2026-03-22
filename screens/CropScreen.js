import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  PanResponder, Animated, Dimensions, SafeAreaView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { calcCenterCrop } from '../services/imageService';

const SCREEN_W = Dimensions.get('window').width;
const TARGET_RATIO = 2 / 3;
const SCREEN_H = Dimensions.get('window').height;
const _FW = SCREEN_W - 32;
const _FH = _FW / TARGET_RATIO;
// Scale proportionally so FRAME fits on screen while keeping 2:3 ratio
const _SCALE = Math.min(1, (SCREEN_H * 0.58) / _FH);
const FRAME_W = Math.round(_FW * _SCALE);
const FRAME_H = Math.round(_FH * _SCALE);

export default function CropScreen({ route, navigation }) {
  const { uri, width: origW, height: origH, fileName } = route.params;

  const scaleToFit = Math.max(FRAME_W / origW, FRAME_H / origH);
  const [scale, setScale] = useState(scaleToFit);

  const offsetRef = useRef({ x: 0, y: 0 });
  const panX = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;
  const scaleRef = useRef(scaleToFit);
  useEffect(() => { scaleRef.current = scale; }, [scale]);

  const constrain = (dx, dy, s) => {
    const imgW = origW * s;
    const imgH = origH * s;
    const halfExcessX = Math.max(0, (imgW - FRAME_W) / 2);
    const halfExcessY = Math.max(0, (imgH - FRAME_H) / 2);
    return {
      x: Math.max(-halfExcessX, Math.min(halfExcessX, dx)),
      y: Math.max(-halfExcessY, Math.min(halfExcessY, dy)),
    };
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, { dx, dy }) => {
        const s = scaleRef.current;
        const { x, y } = constrain(offsetRef.current.x + dx, offsetRef.current.y + dy, s);
        panX.setValue(x);
        panY.setValue(y);
      },
      onPanResponderRelease: (_, { dx, dy }) => {
        const s = scaleRef.current;
        const { x, y } = constrain(offsetRef.current.x + dx, offsetRef.current.y + dy, s);
        offsetRef.current = { x, y };
        panX.setValue(x);
        panY.setValue(y);
      },
    })
  ).current;

  const handleZoomIn = () => {
    const newScale = Math.min(scale * 1.1, scaleToFit * 3);
    setScale(newScale);
    scaleRef.current = newScale;
    const { x, y } = constrain(offsetRef.current.x, offsetRef.current.y, newScale);
    offsetRef.current = { x, y };
    panX.setValue(x);
    panY.setValue(y);
  };

  const handleZoomOut = () => {
    const newScale = Math.max(scale * 0.91, scaleToFit);
    setScale(newScale);
    scaleRef.current = newScale;
    const { x, y } = constrain(offsetRef.current.x, offsetRef.current.y, newScale);
    offsetRef.current = { x, y };
    panX.setValue(x);
    panY.setValue(y);
  };

  const handleReset = () => {
    setScale(scaleToFit);
    scaleRef.current = scaleToFit;
    offsetRef.current = { x: 0, y: 0 };
    panX.setValue(0);
    panY.setValue(0);
  };

  const handleConfirm = () => {
    const s = scaleRef.current;
    const imgW = origW * s;
    const imgH = origH * s;
    const imgLeft = (FRAME_W - imgW) / 2 + offsetRef.current.x;
    const imgTop = (FRAME_H - imgH) / 2 + offsetRef.current.y;
    const cropX = (-imgLeft) / s;
    const cropY = (-imgTop) / s;
    const cropW = FRAME_W / s;
    const cropH = FRAME_H / s;
    const cropParams = {
      originX: Math.max(0, Math.round(cropX)),
      originY: Math.max(0, Math.round(cropY)),
      width: Math.min(origW, Math.round(cropW)),
      height: Math.min(origH, Math.round(cropH)),
    };
    navigation.navigate('Publish', { uri, fileName, cropParams });
  };

  const handleAutoCrop = () => {
    const centerCrop = calcCenterCrop(origW, origH, 2, 3);
    navigation.navigate('Publish', { uri, fileName, cropParams: centerCrop });
  };

  const imgDisplayW = origW * scale;
  const imgDisplayH = origH * scale;
  const imageLeft = (FRAME_W - imgDisplayW) / 2;
  const imageTop = (FRAME_H - imgDisplayH) / 2;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.instruction}>
        Déplacez l'image pour cadrer votre bijou dans le cadre
      </Text>

      <View style={[styles.frameContainer, { width: FRAME_W, height: FRAME_H }]}>
        <Animated.View
          {...panResponder.panHandlers}
          style={[styles.imageWrapper, {
            width: imgDisplayW, height: imgDisplayH,
            left: imageLeft, top: imageTop,
            transform: [{ translateX: panX }, { translateY: panY }],
          }]}
        >
          <Image source={{ uri }} style={{ width: imgDisplayW, height: imgDisplayH }} resizeMode="cover" />
        </Animated.View>

        {[styles.cornerTL, styles.cornerTR, styles.cornerBL, styles.cornerBR].map((corner, i) => (
          <View key={i} style={[styles.corner, corner]} pointerEvents="none" />
        ))}
        <View style={styles.crossH} pointerEvents="none" />
        <View style={styles.crossV} pointerEvents="none" />
      </View>

      <View style={styles.zoomRow}>
        <TouchableOpacity style={styles.zoomBtn} onPress={handleZoomOut}>
          <Text style={styles.zoomText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.zoomLabel}>Zoom {Math.round((scale / scaleToFit) * 100)}%</Text>
        <TouchableOpacity style={styles.zoomBtn} onPress={handleZoomIn}>
          <Text style={styles.zoomText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Ionicons name="refresh-outline" size={18} color="#6b7280" />
          <Text style={styles.resetText}>Recentrer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.autoBtn} onPress={handleAutoCrop}>
          <Ionicons name="flash-outline" size={18} color="#2563eb" />
          <Text style={styles.autoText}>Auto</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
          <Ionicons name="checkmark" size={18} color="#fff" />
          <Text style={styles.confirmText}>Confirmer</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const CORNER_SIZE = 20;
const CORNER_THICKNESS = 3;
const CORNER_COLOR = '#fff';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827', alignItems: 'center', paddingTop: 12, paddingBottom: 16 },
  instruction: { color: '#d1d5db', fontSize: 13, textAlign: 'center', marginBottom: 12, paddingHorizontal: 24 },
  frameContainer: { overflow: 'hidden', backgroundColor: '#000', borderRadius: 4, position: 'relative' },
  imageWrapper: { position: 'absolute' },
  corner: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderColor: CORNER_COLOR },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderColor: CORNER_COLOR },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderColor: CORNER_COLOR },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderColor: CORNER_COLOR },
  crossH: { position: 'absolute', top: '50%', left: '20%', right: '20%', height: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  crossV: { position: 'absolute', left: '50%', top: '20%', bottom: '20%', width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  zoomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: 16 },
  zoomBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#374151', alignItems: 'center', justifyContent: 'center' },
  zoomText: { color: '#fff', fontSize: 24, fontWeight: '300', lineHeight: 28 },
  zoomLabel: { color: '#9ca3af', fontSize: 13, minWidth: 80, textAlign: 'center' },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 16, paddingHorizontal: 16 },
  resetBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, backgroundColor: '#1f2937', borderRadius: 10 },
  resetText: { color: '#9ca3af', fontSize: 14 },
  autoBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, backgroundColor: '#1e3a8a', borderRadius: 10 },
  autoText: { color: '#93c5fd', fontSize: 14, fontWeight: '600' },
  confirmBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, backgroundColor: '#16a34a', borderRadius: 10 },
  confirmText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
