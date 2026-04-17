import { StyleSheet } from 'react-native';
import { FieldType } from '../../types/record';

export const FIELD_COLORS: Record<FieldType, string> = {
  artist_name: '#E63946',  // red
  album_name: '#F4A261',   // amber
  record_ref: '#457B9D',   // steel-blue
  unknown: '#444',         // grey
};

export const chipColor = (ft: FieldType) => FIELD_COLORS[ft] ?? FIELD_COLORS.unknown;

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    maxWidth: '100%',
  },
  chipText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default styles;
