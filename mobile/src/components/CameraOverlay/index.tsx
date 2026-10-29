import React from 'react';
import { Text, View } from 'react-native';
import styles from './styles';

/**
 * Dims everything outside a centered frame and marks the frame with corner
 * brackets, so the user knows where to place the catalog number.
 * The frame geometry (FRAME_W × FRAME_H, centered) is what cropToOverlayFrame crops to.
 */
const CameraOverlay: React.FC = () => (
  <View style={styles.container} pointerEvents="none">
    <View style={styles.topMask}>
      <Text style={styles.title}>Scan the catalog number</Text>
      <Text style={styles.hint}>Fit it inside the frame, then tap the shutter</Text>
    </View>
    <View style={styles.middle}>
      <View style={styles.sideMask} />
      <View style={styles.frame}>
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />
      </View>
      <View style={styles.sideMask} />
    </View>
    <View style={styles.bottomMask} />
  </View>
);

export default CameraOverlay;
