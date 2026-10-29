import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  type LayoutRectangle,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button from '../../components/Button';
import CameraOverlay from '../../components/CameraOverlay';
import { useOcr } from '../../hooks/useOcr';
import { setImageUri } from '../../store/slices/captureSlice';
import type { RootStackParamList } from '../../navigation/types';
import { cropToOverlayFrame } from '../../utils/cropToOverlayFrame';
import { colors, spacing } from '../../theme';
import styles from './styles';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Capture'>;

const CaptureScreen: React.FC = () => {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);
  const [torch, setTorch] = useState(false);
  const [previewLayout, setPreviewLayout] = useState<LayoutRectangle | null>(null);
  const dispatch = useDispatch();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { runOcr, loading, error } = useOcr();
  const busy = capturing || loading;

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

      const finalUri =
        previewLayout && photo.width && photo.height
          ? await cropToOverlayFrame(
              { uri: photo.uri, width: photo.width, height: photo.height },
              previewLayout,
            )
          : photo.uri;

      dispatch(setImageUri(finalUri));
      await runOcr(finalUri);
      navigation.navigate('Label', { prefillFromOcr: true });
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Capture failed.');
    } finally {
      setCapturing(false);
    }
  }, [capturing, loading, dispatch, runOcr, navigation, previewLayout]);

  const handleManual = useCallback(() => {
    navigation.navigate('Label', { prefillFromOcr: false });
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
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!permission.granted) {
    // canAskAgain=false: permanently denied (iOS "Don't Allow", or revoked in
    // Android settings) — the system prompt can no longer be shown.
    const blocked = !permission.canAskAgain;
    return (
      <View style={[styles.center, { paddingBottom: insets.bottom + spacing.xl }]}>
        <View style={styles.permissionIcon}>
          <Ionicons name="camera" size={34} color={colors.accent} />
        </View>
        <Text style={styles.permissionTitle}>
          {blocked ? 'Camera access is off' : 'Allow camera access'}
        </Text>
        <Text style={styles.permissionText}>
          {blocked
            ? 'Turn on camera access in your device settings to scan catalog numbers.'
            : 'Digger Helper uses the camera to read the catalog number printed on the label.'}
        </Text>
        <View style={styles.permissionActions}>
          <Button
            label={blocked ? 'Open settings' : 'Allow camera'}
            icon={blocked ? 'settings-outline' : 'camera-outline'}
            onPress={blocked ? handleOpenSettings : requestPermission}
          />
          <Button label="Enter details manually" variant="ghost" onPress={handleManual} />
        </View>
      </View>
    );
  }

  // ── Camera ready ───────────────────────────────────────────
  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        enableTorch={torch}
        onLayout={(e) => setPreviewLayout(e.nativeEvent.layout)}
      >
        <CameraOverlay />
      </CameraView>

      <View style={[styles.controls, { paddingBottom: insets.bottom + spacing.lg }]}>
        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={18} color={colors.danger} />
            <Text style={styles.errorText} numberOfLines={3}>{error}</Text>
          </View>
        )}

        <View style={styles.controlRow}>
          <Pressable
            style={styles.sideAction}
            onPress={handleManual}
            accessibilityRole="button"
            accessibilityLabel="Enter details manually"
          >
            <View style={styles.sideIcon}>
              <Ionicons name="create-outline" size={22} color={colors.text} />
            </View>
            <Text style={styles.sideLabel}>Type it</Text>
          </Pressable>

          <Pressable
            onPress={handleCapture}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Scan catalog number"
            style={({ pressed }) => [styles.shutter, pressed && styles.shutterPressed]}
          >
            <View style={[styles.shutterInner, busy && styles.shutterInnerBusy]}>
              {busy && <ActivityIndicator color="#fff" />}
            </View>
          </Pressable>

          <Pressable
            style={styles.sideAction}
            onPress={() => setTorch((on) => !on)}
            accessibilityRole="switch"
            accessibilityState={{ checked: torch }}
            accessibilityLabel="Torch"
          >
            <View style={[styles.sideIcon, torch && styles.sideIconActive]}>
              <Ionicons name={torch ? 'flash' : 'flash-outline'} size={22} color={torch ? colors.bg : colors.text} />
            </View>
            <Text style={styles.sideLabel}>Torch</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export default CaptureScreen;
