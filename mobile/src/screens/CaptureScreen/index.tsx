import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import CameraOverlay from '../../components/CameraOverlay';
import { useOcr } from '../../hooks/useOcr';
import { setImageUri } from '../../store/slices/captureSlice';
import type { RootStackParamList } from '../../navigation/types';
import styles from './styles';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Capture'>;

const CaptureScreen: React.FC = () => {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);
  const dispatch = useDispatch();
  const navigation = useNavigation<Nav>();
  const { runOcr, loading, error } = useOcr();

  // ── All callbacks MUST be declared before any early return (Rules of Hooks) ──

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || capturing || loading) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        // skipProcessing reduces latency on Android without quality loss for OCR
        skipProcessing: Platform.OS === 'android',
      });
      if (!photo?.uri) throw new Error('No photo returned from camera.');
      dispatch(setImageUri(photo.uri));
      await runOcr(photo.uri);
      navigation.navigate('Label');
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Capture failed.');
    } finally {
      setCapturing(false);
    }
  }, [capturing, loading, dispatch, runOcr, navigation]);

  const handleManual = useCallback(() => {
    navigation.navigate('Label');
  }, [navigation]);

  const handleOpenSettings = useCallback(() => {
    // On iOS: opens the app's Settings page so the user can re-enable camera.
    // On Android: opens the app's permission settings.
    Linking.openSettings();
  }, []);

  // ── Permission gate (after all hooks) ─────────────────────

  // Still loading permission status
  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#E63946" />
      </View>
    );
  }

  // Permission permanently denied (user tapped "Don't Allow" on iOS,
  // or revoked in Android settings) — can no longer prompt via API.
  if (!permission.granted && !permission.canAskAgain) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionTitle}>Camera access denied</Text>
        <Text style={styles.permissionText}>
          Please enable camera access in your device settings to scan record refs.
        </Text>
        <TouchableOpacity style={styles.btnPrimary} onPress={handleOpenSettings}>
          <Text style={styles.btnText}>Open Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSecondary} onPress={handleManual}>
          <Text style={styles.btnTextSecondary}>Manually set info</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Permission not yet granted but can still be requested
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionTitle}>Camera access required</Text>
        <Text style={styles.permissionText}>
          Digger Helper needs your camera to scan the record ref printed on the label.
        </Text>
        <TouchableOpacity style={styles.btnPrimary} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant Camera Access</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSecondary} onPress={handleManual}>
          <Text style={styles.btnTextSecondary}>Manually set info</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Camera ready ───────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Camera feed — rear-facing, portrait, full screen */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        // Prevent auto-focus tap from being blocked by the overlay
        onCameraReady={() => {/* camera is ready */}}
      >
        <CameraOverlay />
      </CameraView>

      {/* Controls */}
      <View style={styles.controls}>
        {error && (
          <ScrollView style={styles.errorBox} keyboardShouldPersistTaps="handled">
            <Text style={styles.errorText}>{error}</Text>
          </ScrollView>
        )}

        <TouchableOpacity
          style={[styles.btnPrimary, (capturing || loading) && styles.btnDisabled]}
          onPress={handleCapture}
          disabled={capturing || loading}
        >
          {capturing || loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>📷  Scan Record Ref</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnSecondary} onPress={handleManual}>
          <Text style={styles.btnTextSecondary}>Manually set info</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CaptureScreen;

