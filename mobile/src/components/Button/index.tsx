import React from 'react';
import { ActivityIndicator, Pressable, Text, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, type IconName } from '../../theme';
import styles from './styles';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const Button: React.FC<Props> = ({
  label, onPress, variant = 'primary', icon, loading = false, disabled = false, style,
}) => {
  const inactive = disabled || loading;
  const fg = inactive && !loading
    ? colors.textFaint
    : variant === 'primary' ? '#fff' : variant === 'secondary' ? colors.text : colors.textMuted;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles[`${variant}Pressed`],
        inactive && !loading && (variant === 'primary' ? styles.primaryDisabled : styles.disabled),
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={18} color={fg} />}
          <Text style={[styles.label, { color: fg }]} numberOfLines={1}>{label}</Text>
        </>
      )}
    </Pressable>
  );
};

export default Button;
