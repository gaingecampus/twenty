import { useGuardRecordIndexInlineEdit } from '@/object-record/record-index/hooks/useGuardRecordIndexInlineEdit';
import { isRecordTableCheckboxColumnHiddenComponentState } from '@/object-record/record-table/states/isRecordTableCheckboxColumnHiddenComponentState';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';

export const useIsRecordTableCheckboxColumnHidden = (
  recordTableId?: string,
) => {
  const { isInlineEditEnabled } = useGuardRecordIndexInlineEdit();
  const isRecordTableCheckboxColumnHidden = useAtomComponentStateValue(
    isRecordTableCheckboxColumnHiddenComponentState,
    recordTableId,
  );

  return isRecordTableCheckboxColumnHidden || !isInlineEditEnabled;
};
