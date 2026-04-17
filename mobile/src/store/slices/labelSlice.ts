import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FieldType, LabelledField } from '../../types/record';

interface LabelState {
  /** One entry per OCR text block, in the same order */
  fields: LabelledField[];
  /** Free-text fields the user typed manually (no OCR block behind them) */
  manualFields: LabelledField[];
}

const initialState: LabelState = {
  fields: [],
  manualFields: [],
};

const labelSlice = createSlice({
  name: 'label',
  initialState,
  reducers: {
    /** Initialise from OCR blocks — auto-typed as record_ref (scan-record-ref flow) */
    initFromBlocks(state, action: PayloadAction<string[]>) {
      state.fields = action.payload.map((text) => ({ text, fieldType: 'record_ref' }));
      state.manualFields = [];
    },
    /** Assign a FieldType to one of the OCR-derived fields */
    assignFieldType(
      state,
      action: PayloadAction<{ index: number; fieldType: FieldType }>,
    ) {
      const field = state.fields[action.payload.index];
      if (field) field.fieldType = action.payload.fieldType;
    },
    /** Edit the text of an OCR-derived field (user correction) */
    editFieldText(
      state,
      action: PayloadAction<{ index: number; text: string }>,
    ) {
      const field = state.fields[action.payload.index];
      if (field) field.text = action.payload.text;
    },
    /** Remove one OCR-derived field */
    removeField(state, action: PayloadAction<number>) {
      state.fields.splice(action.payload, 1);
    },
    /** Add a brand-new field typed manually */
    addManualField(state, action: PayloadAction<LabelledField>) {
      state.manualFields.push(action.payload);
    },
    /** Edit a manually added field */
    editManualField(
      state,
      action: PayloadAction<{ index: number; text: string; fieldType: FieldType }>,
    ) {
      const f = state.manualFields[action.payload.index];
      if (f) {
        f.text = action.payload.text;
        f.fieldType = action.payload.fieldType;
      }
    },
    /** Remove a manually added field */
    removeManualField(state, action: PayloadAction<number>) {
      state.manualFields.splice(action.payload, 1);
    },
    reset: () => initialState,
  },
});

export const {
  initFromBlocks,
  assignFieldType,
  editFieldText,
  removeField,
  addManualField,
  editManualField,
  removeManualField,
  reset,
} = labelSlice.actions;

export default labelSlice.reducer;

