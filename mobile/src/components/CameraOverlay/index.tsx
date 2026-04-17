import React from 'react';
import { View } from 'react-native';
import styles from './styles';

/**
 * Transparent overlay that draws a rounded rectangle guide
 * so the user knows where to frame the record sleeve.
 */
const CameraOverlay: React.FC = () => (
  <View style={styles.container} pointerEvents="none">
    <View style={styles.topMask} />
    <View style={styles.middle}>
      <View style={styles.sideMask} />
      <View style={styles.frame} />
      <View style={styles.sideMask} />
    </View>
    <View style={styles.bottomMask} />
  </View>
);

export default CameraOverlay;
