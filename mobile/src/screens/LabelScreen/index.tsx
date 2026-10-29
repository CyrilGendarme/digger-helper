import React, { useState, useEffect } from 'react';
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
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
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
type LabelRoute = RouteProp<RootStackParamList, 'Label'>;

// ── Constants ────────────────────────────────────────────────────────────────
const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'artist_name', label: '🎤 Artist name' },
  { value: 'album_name', label: '💿 Album name' },
  { value: 'record_ref', label: '🔖 Record ref' },
  { value: 'unknown', label: '❓ Unknown / skip' },
];
const MANUAL_FIELD_TYPES = FIELD_TYPES.filter((f) => f.value !== 'unknown');
const FIELD_TYPE_LABEL = Object.fromEntries(
  FIELD_TYPES.map(({ value, label }) => [value, label]),
) as Record<FieldType, string>;

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
  const [fieldType, setFieldType] = useState<FieldType>('record_ref');

  const handleAdd = () => {
    if (!text.trim()) {
      Alert.alert('Empty', 'Please enter some text first.');
      return;
    }
    if (fieldType === 'unknown') {
      Alert.alert('Invalid type', 'Please choose Artist, Album, or Record ref.');
      return;
    }
    onAdd({ text: text.trim(), fieldType });
    setText('');
    setFieldType('record_ref');
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
            {MANUAL_FIELD_TYPES.map(({ value, label }) => (
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
  const route = useRoute<LabelRoute>();
  const shouldPrefill = route.params?.prefillFromOcr ?? false;
  const blocks = useSelector((state: RootState) => state.capture.blocks);
  const {
    fields, manualFields, reset, init, assign, remove, addManual, editManual, removeManual,
  } = useLabel();

  // Open Label empty by default, but prefill from OCR when explicitly coming from scan flow.
  // Runs on mount (not on every focus) so returning from Info keeps the user's edits.
  useEffect(() => {
    reset();
    if (shouldPrefill && blocks.length > 0) {
      init(blocks.map((b) => b.text));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks, shouldPrefill]);

  // Assign-type modal state
  const [assignTarget, setAssignTarget] = useState<{ index: number; isManual: boolean } | null>(null);
  const [addManualVisible, setAddManualVisible] = useState(false);

  const openAssign = (index: number, isManual: boolean) =>
    setAssignTarget({ index, isManual });
  const closeAssign = () => setAssignTarget(null);

  // Derive the field being assigned (for the modal display)
  const targetField = assignTarget
    ? assignTarget.isManual
      ? manualFields[assignTarget.index]
      : fields[assignTarget.index]
    : null;

  const handleSelect = (ft: FieldType) => {
    if (!assignTarget || !targetField) return;
    if (assignTarget.isManual) {
      editManual(assignTarget.index, targetField.text, ft);
    } else {
      assign(assignTarget.index, ft);
    }
    closeAssign();
  };

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
  const renderRow = (item: LabelledField, index: number, isManual: boolean) => (
    <View key={isManual ? `manual-${index}` : undefined} style={styles.row}>
      <TextChip
        label={item.text}
        fieldType={item.fieldType}
        onPress={() => openAssign(index, isManual)}
      />
      <View style={styles.rowMeta}>
        <Text style={styles.typeLabel}>{FIELD_TYPE_LABEL[item.fieldType] ?? '❓'}</Text>
        <TouchableOpacity
          onPress={() => (isManual ? removeManual(index) : remove(index))}
          style={styles.deleteBtn}
        >
          <Text style={styles.deleteText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Legend */}
      <View style={styles.legend}>
        {MANUAL_FIELD_TYPES.map(({ value, label }) => (
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
          renderItem={({ item, index }) => renderRow(item, index, false)}
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
                {manualFields.map((item, index) => renderRow(item, index, true))}
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
