import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { FieldType } from '../../types/record';
import styles, { chipColor } from './styles';

interface Props {
  label: string;
  fieldType: FieldType;
  onPress: () => void;
}

const TextChip: React.FC<Props> = ({ label, fieldType, onPress }) => (
  <TouchableOpacity
    style={[styles.chip, { backgroundColor: chipColor(fieldType) }]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <Text style={styles.chipText} numberOfLines={1}>
      {label}
    </Text>
  </TouchableOpacity>
);

export default TextChip;
