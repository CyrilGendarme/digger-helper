import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useLabel } from '../../hooks/useLabel';
import TextChip from '../../components/TextChip';
import { FIELD_COLORS } from '../../components/TextChip/styles';
import { FieldType, LabelledField } from '../../types/record';
import type { RootStackParamList } from '../../navigation/types';
import styles from './styles';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Label'>;

// ── Constants ────────────────────────────────────────────────────────────────
const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'artist_name', label: '🎤 Artist name' },
  { value: 'album_name', label: '💿 Album name' },
  { value: 'record_ref', label: '🔖 Record ref' },
  { value: 'unknown', label: '❓ Unknown / skip' },
];

// ── Assign modal ─────────────────────────────────────────────────────────────
interface AssignModalProps {
  visible: boolean;
  text: string;
  currentType: FieldType;
  onSelect: (ft: FieldType) => void;
  onClose: () => void;
}

const AssignModal: React.FC<AssignModalProps> = ({
  visible, text, currentType, onSelect, onClose,
}) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalSheet}
      >
        <Text style={styles.modalTitle} numberOfLines={2}>"{text}"</Text>
        <Text style={styles.modalSubtitle}>Assign a field type:</Text>
        {FIELD_TYPES.map(({ value, label }) => (
          <TouchableOpacity
            key={value}
            style={[
              styles.modalOption,
              currentType === value && { borderColor: FIELD_COLORS[value], borderWidth: 2 },
            ]}
            onPress={() => onSelect(value)}
          >
            <View style={[styles.dot, { backgroundColor: FIELD_COLORS[value] }]} />
            <Text style={styles.modalOptionText}>{label}</Text>
            {currentType === value && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        ))}
      </KeyboardAvoidingView>
    </TouchableOpacity>
  </Modal>
);

// ── Add-manual modal ─────────────────────────────────────────────────────────
interface AddManualModalProps {
  visible: boolean;
  onAdd: (field: LabelledField) => void;
  onClose: () => void;
}

const AddManualModal: React.FC<AddManualModalProps> = ({ visible, onAdd, onClose }) => {
  const [text, setText] = useState('');
  const [fieldType, setFieldType] = useState<FieldType>('unknown');

  const handleAdd = () => {
    if (!text.trim()) {
      Alert.alert('Empty', 'Please enter some text first.');
      return;
    }
    onAdd({ text: text.trim(), fieldType });
    setText('');
    setFieldType('unknown');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalSheet}
        >
          <Text style={styles.modalTitle}>Add field manually</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Type the text…"
            placeholderTextColor="#666"
            value={text}
            onChangeText={setText}
            autoFocus
          />
          <Text style={styles.modalSubtitle}>Field type:</Text>
          <ScrollView>
            {FIELD_TYPES.map(({ value, label }) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.modalOption,
                  fieldType === value && { borderColor: FIELD_COLORS[value], borderWidth: 2 },
                ]}
                onPress={() => setFieldType(value)}
              >
                <View style={[styles.dot, { backgroundColor: FIELD_COLORS[value] }]} />
                <Text style={styles.modalOptionText}>{label}</Text>
                {fieldType === value && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.btnPrimary} onPress={handleAdd}>
            <Text style={styles.btnText}>Add</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
};

// ── Main screen ───────────────────────────────────────────────────────────────
const LabelScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const blocks = useSelector((state: RootState) => state.capture.blocks);
  const { fields, manualFields, reset, init, assign, remove, addManual, removeManual } = useLabel();

  // Reset and re-populate from OCR blocks every time this screen comes into focus
  useFocusEffect(
    useCallback(() => {
      reset();
      if (blocks.length > 0) {
        init(blocks.map((b) => b.text));
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [blocks]),
  );

  // Assign-type modal state
  const [assignTarget, setAssignTarget] = useState<{ index: number; isManual: boolean } | null>(null);
  const [addManualVisible, setAddManualVisible] = useState(false);

  const openAssign = (index: number, isManual: boolean) =>
    setAssignTarget({ index, isManual });
  const closeAssign = () => setAssignTarget(null);

  const handleSelect = useCallback(
    (ft: FieldType) => {
      if (!assignTarget) return;
      assign(assignTarget.index, ft);
      closeAssign();
    },
    [assignTarget, assign],
  );

  // Derive the field being assigned (for the modal display)
  const targetField = assignTarget
    ? assignTarget.isManual
      ? manualFields[assignTarget.index]
      : fields[assignTarget.index]
    : null;

  // Validate before proceeding: at least one non-unknown field
  const handleNext = () => {
    const all = [...fields, ...manualFields];
    const hasLabelled = all.some((f) => f.fieldType !== 'unknown');
    if (!hasLabelled) {
      Alert.alert('Nothing labelled', 'Assign at least one field type before continuing.');
      return;
    }
    navigation.navigate('Info');
  };

  // ── Render helpers ─────────────────────────────────────────────────────────
  const renderField = ({ item, index }: { item: LabelledField; index: number }) => (
    <View style={styles.row}>
      <TextChip
        label={item.text}
        fieldType={item.fieldType}
        onPress={() => openAssign(index, false)}
      />
      <View style={styles.rowMeta}>
        <Text style={styles.typeLabel}>
          {FIELD_TYPES.find((f) => f.value === item.fieldType)?.label ?? '❓'}
        </Text>
        <TouchableOpacity onPress={() => remove(index)} style={styles.deleteBtn}>
          <Text style={styles.deleteText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderManual = ({ item, index }: { item: LabelledField; index: number }) => (
    <View style={styles.row}>
      <TextChip
        label={item.text}
        fieldType={item.fieldType}
        onPress={() => openAssign(index, true)}
      />
      <View style={styles.rowMeta}>
        <Text style={styles.typeLabel}>
          {FIELD_TYPES.find((f) => f.value === item.fieldType)?.label ?? '❓'}
        </Text>
        <TouchableOpacity onPress={() => removeManual(index)} style={styles.deleteBtn}>
          <Text style={styles.deleteText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Legend */}
      <View style={styles.legend}>
        {FIELD_TYPES.filter((f) => f.value !== 'unknown').map(({ value, label }) => (
          <View key={value} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: FIELD_COLORS[value] }]} />
            <Text style={styles.legendText}>{label}</Text>
          </View>
        ))}
      </View>

      {/* OCR-extracted blocks */}
      {fields.length === 0 && manualFields.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No OCR text found. Add fields manually.</Text>
        </View>
      ) : (
        <FlatList
          data={fields}
          keyExtractor={(_, i) => `ocr-${i}`}
          renderItem={renderField}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            fields.length > 0 ? (
              <Text style={styles.sectionHeader}>Extracted text — tap to assign</Text>
            ) : null
          }
          ListFooterComponent={
            manualFields.length > 0 ? (
              <>
                <Text style={styles.sectionHeader}>Manually added</Text>
                {manualFields.map((item, index) =>
                  renderManual({ item, index }),
                )}
              </>
            ) : null
          }
        />
      )}

      {/* Bottom actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={() => setAddManualVisible(true)}
        >
          <Text style={styles.btnTextSecondary}>+ Add field manually</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnPrimary} onPress={handleNext}>
          <Text style={styles.btnText}>Next →</Text>
        </TouchableOpacity>
      </View>

      {/* Assign-type modal */}
      {targetField && (
        <AssignModal
          visible={!!assignTarget}
          text={targetField.text}
          currentType={targetField.fieldType}
          onSelect={handleSelect}
          onClose={closeAssign}
        />
      )}

      {/* Add-manual modal */}
      <AddManualModal
        visible={addManualVisible}
        onAdd={addManual}
        onClose={() => setAddManualVisible(false)}
      />
    </View>
  );
};

export default LabelScreen;
