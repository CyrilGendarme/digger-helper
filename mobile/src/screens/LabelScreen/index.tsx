import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useLabel } from '../../hooks/useLabel';
import BottomSheet from '../../components/BottomSheet';
import Button from '../../components/Button';
import { FieldType, LabelledField } from '../../types/record';
import type { RootStackParamList } from '../../navigation/types';
import { colors, FIELD_META, spacing } from '../../theme';
import styles from './styles';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Label'>;
type LabelRoute = RouteProp<RootStackParamList, 'Label'>;

// ── Constants ────────────────────────────────────────────────────────────────
const FIELD_TYPES: FieldType[] = ['artist_name', 'album_name', 'record_ref', 'unknown'];
const MANUAL_FIELD_TYPES = FIELD_TYPES.filter((t) => t !== 'unknown');

// ── Shared pieces ────────────────────────────────────────────────────────────
const TypeBadge: React.FC<{ fieldType: FieldType; size?: number }> = ({ fieldType, size = 40 }) => {
  const { icon, color } = FIELD_META[fieldType];
  return (
    <View
      style={[
        styles.typeBadge,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: `${color}22` },
      ]}
    >
      <Ionicons name={icon} size={size * 0.48} color={color} />
    </View>
  );
};

interface TypeOptionsProps {
  types: FieldType[];
  selected: FieldType;
  onSelect: (ft: FieldType) => void;
}

const TypeOptions: React.FC<TypeOptionsProps> = ({ types, selected, onSelect }) => (
  <View style={styles.options}>
    {types.map((value) => {
      const active = selected === value;
      return (
        <Pressable
          key={value}
          style={({ pressed }) => [
            styles.option,
            active && { borderColor: FIELD_META[value].color },
            pressed && styles.optionPressed,
          ]}
          onPress={() => onSelect(value)}
          accessibilityRole="radio"
          accessibilityState={{ selected: active }}
        >
          <TypeBadge fieldType={value} size={34} />
          <Text style={styles.optionText}>{FIELD_META[value].label}</Text>
          {active && <Ionicons name="checkmark-circle" size={22} color={FIELD_META[value].color} />}
        </Pressable>
      );
    })}
  </View>
);

// ── Add-manual sheet ─────────────────────────────────────────────────────────
interface AddManualSheetProps {
  visible: boolean;
  onAdd: (field: LabelledField) => void;
  onClose: () => void;
}

const AddManualSheet: React.FC<AddManualSheetProps> = ({ visible, onAdd, onClose }) => {
  const [text, setText] = useState('');
  const [fieldType, setFieldType] = useState<FieldType>('record_ref');

  const handleAdd = () => {
    if (!text.trim()) {
      Alert.alert('Empty', 'Please enter some text first.');
      return;
    }
    onAdd({ text: text.trim(), fieldType });
    setText('');
    setFieldType('record_ref');
    onClose();
  };

  return (
    <BottomSheet visible={visible} title="Add a field" onClose={onClose}>
      <TextInput
        style={styles.textInput}
        placeholder="e.g. Quantic, Mango, TRU123…"
        placeholderTextColor={colors.textFaint}
        value={text}
        onChangeText={setText}
        onSubmitEditing={handleAdd}
        returnKeyType="done"
        autoFocus
      />
      <TypeOptions types={MANUAL_FIELD_TYPES} selected={fieldType} onSelect={setFieldType} />
      <Button label="Add field" icon="add" onPress={handleAdd} style={styles.sheetButton} />
    </BottomSheet>
  );
};

// ── Main screen ───────────────────────────────────────────────────────────────
const LabelScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<LabelRoute>();
  const insets = useSafeAreaInsets();
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

  // Assign-type sheet state
  const [assignTarget, setAssignTarget] = useState<{ index: number; isManual: boolean } | null>(null);
  const [addManualVisible, setAddManualVisible] = useState(false);

  const openAssign = (index: number, isManual: boolean) =>
    setAssignTarget({ index, isManual });
  const closeAssign = () => setAssignTarget(null);

  // Derive the field being assigned (for the sheet display)
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
  const renderRow = (item: LabelledField, index: number, isManual: boolean) => {
    const meta = FIELD_META[item.fieldType];
    const skipped = item.fieldType === 'unknown';
    return (
      <Pressable
        key={isManual ? `manual-${index}` : undefined}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        onPress={() => openAssign(index, isManual)}
        accessibilityRole="button"
        accessibilityLabel={`${item.text}, ${meta.label}. Change type`}
      >
        <TypeBadge fieldType={item.fieldType} />
        <View style={styles.rowBody}>
          <Text style={[styles.rowType, { color: meta.color }]}>{meta.label}</Text>
          <Text style={[styles.rowText, skipped && styles.rowTextSkipped]} numberOfLines={2}>
            {item.text}
          </Text>
        </View>
        <Pressable
          onPress={() => (isManual ? removeManual(index) : remove(index))}
          style={styles.deleteBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${item.text}`}
        >
          <Ionicons name="close" size={18} color={colors.textFaint} />
        </Pressable>
      </Pressable>
    );
  };

  const isEmpty = fields.length === 0 && manualFields.length === 0;

  return (
    <View style={styles.container}>
      {isEmpty ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="document-text-outline" size={30} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>
            {shouldPrefill ? 'No text detected' : 'What are you looking for?'}
          </Text>
          <Text style={styles.emptyText}>
            Add the artist, album or catalog number to search for the record.
          </Text>
        </View>
      ) : (
        <FlatList
          data={fields}
          keyExtractor={(_, i) => `ocr-${i}`}
          renderItem={({ item, index }) => renderRow(item, index, false)}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <>
              <Text style={styles.intro}>Tap a field to change what it is.</Text>
              {fields.length > 0 && <Text style={styles.sectionHeader}>Scanned</Text>}
            </>
          }
          ListFooterComponent={
            manualFields.length > 0 ? (
              <>
                <Text style={styles.sectionHeader}>Added by you</Text>
                {manualFields.map((item, index) => renderRow(item, index, true))}
              </>
            ) : null
          }
        />
      )}

      {/* Bottom actions */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          label="Add field"
          icon="add"
          variant="secondary"
          onPress={() => setAddManualVisible(true)}
          style={styles.footerButton}
        />
        <Button
          label="Search"
          icon="search"
          onPress={handleNext}
          disabled={isEmpty}
          style={styles.footerButton}
        />
      </View>

      {/* Assign-type sheet */}
      {targetField && (
        <BottomSheet
          visible={!!assignTarget}
          title={`“${targetField.text}”`}
          subtitle="What is this?"
          onClose={closeAssign}
        >
          <TypeOptions
            types={FIELD_TYPES}
            selected={targetField.fieldType}
            onSelect={handleSelect}
          />
        </BottomSheet>
      )}

      <AddManualSheet
        visible={addManualVisible}
        onAdd={addManual}
        onClose={() => setAddManualVisible(false)}
      />
    </View>
  );
};

export default LabelScreen;
