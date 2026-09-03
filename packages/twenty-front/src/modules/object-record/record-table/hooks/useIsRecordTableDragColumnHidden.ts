import { useGuardRecordIndexInlineEdit } from '@/object-record/record-index/hooks/useGuardRecordIndexInlineEdit';
import { isRecordTableDragColumnHiddenComponentState } from '@/object-record/record-table/states/isRecordTableDragColumnHiddenComponentState';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';

export const useIsRecordTableDragColumnHidden = (recordTableId?: string) => {
  const { isInlineEditEnabled } = useGuardRecordIndexInlineEdit();
  const isRecordTableDragColumnHidden = useAtomComponentStateValue(
    isRecordTableDragColumnHiddenComponentState,
    recordTableId,
  );

  return isRecordTableDragColumnHidden || !isInlineEditEnabled;
};
