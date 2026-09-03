import { useGuardRecordIndexInlineEdit } from '@/object-record/record-index/hooks/useGuardRecordIndexInlineEdit';

export const useIsRecordTableAddColumnButtonHidden = () => {
  const { isInlineEditEnabled } = useGuardRecordIndexInlineEdit();

  return !isInlineEditEnabled;
};
