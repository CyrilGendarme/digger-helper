import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import {
  initFromBlocks,
  assignFieldType,
  editFieldText,
  removeField,
  addManualField,
  editManualField,
  removeManualField,
  reset,
} from '../store/slices/labelSlice';
import { FieldType, LabelledField } from '../types/record';

export function useLabel() {
  const dispatch = useDispatch<AppDispatch>();
  const { fields, manualFields } = useSelector((state: RootState) => state.label);

  return {
    fields,
    manualFields,
    init: (texts: string[]) => dispatch(initFromBlocks(texts)),
    reset: () => dispatch(reset()),
    assign: (index: number, fieldType: FieldType) =>
      dispatch(assignFieldType({ index, fieldType })),
    editText: (index: number, text: string) =>
      dispatch(editFieldText({ index, text })),
    remove: (index: number) => dispatch(removeField(index)),
    addManual: (field: LabelledField) => dispatch(addManualField(field)),
    editManual: (index: number, text: string, fieldType: FieldType) =>
      dispatch(editManualField({ index, text, fieldType })),
    removeManual: (index: number) => dispatch(removeManualField(index)),
  };
}
