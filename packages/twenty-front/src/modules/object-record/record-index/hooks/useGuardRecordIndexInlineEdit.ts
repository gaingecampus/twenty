import { useCallback, useContext } from 'react';

import { t } from '@lingui/core/macro';

import { IsRecordIndexPageContext } from '@/object-record/record-index/components/RecordIndexPageProvider';
import { RECORD_INDEX_INLINE_EDIT_DISABLED_SNACK_BAR_DEDUPE_KEY } from '@/object-record/record-index/constants/RecordIndexInlineEditDisabledSnackBarDedupeKey';
import { isRecordIndexInlineEditModeEnabledState } from '@/object-record/record-index/states/isRecordIndexInlineEditModeEnabledState';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

export const useGuardRecordIndexInlineEdit = () => {
  const isRecordIndexPage = useContext(IsRecordIndexPageContext);
  const isRecordIndexInlineEditModeEnabled = useAtomStateValue(
    isRecordIndexInlineEditModeEnabledState,
  );
  const { enqueueInfoSnackBar } = useSnackBar();

  const isInlineEditEnabled =
    !isRecordIndexPage || isRecordIndexInlineEditModeEnabled;

  const assertInlineEditAllowed = useCallback(() => {
    if (isInlineEditEnabled) {
      return true;
    }

    enqueueInfoSnackBar({
      message: t`Turn on Edit to change this field.`,
      options: {
        dedupeKey: RECORD_INDEX_INLINE_EDIT_DISABLED_SNACK_BAR_DEDUPE_KEY,
      },
    });

    return false;
  }, [enqueueInfoSnackBar, isInlineEditEnabled]);

  return {
    isInlineEditEnabled,
    assertInlineEditAllowed,
  };
};
