import { useStore } from 'jotai';
import { useCallback } from 'react';

import { contextStoreCurrentViewIdComponentState } from '@/context-store/states/contextStoreCurrentViewIdComponentState';
import { useUpdateRecordField } from '@/object-record/record-field/hooks/useUpdateRecordField';
import { visibleRecordFieldsComponentSelector } from '@/object-record/record-field/states/visibleRecordFieldsComponentSelector';
import { useAtomComponentSelectorCallbackState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentSelectorCallbackState';
import { useAtomComponentStateCallbackState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateCallbackState';
import { useSaveCurrentViewFields } from '@/views/hooks/useSaveCurrentViewFields';
import { useGetViewFromState } from '@/views/hooks/useGetViewFromState';
import { mapRecordFieldToViewFieldFromCurrentView } from '@/views/utils/mapRecordFieldToViewFieldFromCurrentView';
import { isDefined } from 'twenty-shared/utils';

export const useMoveRecordField = (recordTableId?: string) => {
  const store = useStore();
  const visibleRecordFields = useAtomComponentSelectorCallbackState(
    visibleRecordFieldsComponentSelector,
    recordTableId,
  );

  const { saveViewFields } = useSaveCurrentViewFields();
  const { getViewFromState } = useGetViewFromState();
  const currentViewIdCallbackState = useAtomComponentStateCallbackState(
    contextStoreCurrentViewIdComponentState,
  );

  const { updateRecordField } = useUpdateRecordField(recordTableId);

  const moveRecordField = useCallback(
    async ({
      direction,
      recordFieldIdToMove,
    }: {
      direction: 'before' | 'after';
      recordFieldIdToMove: string;
    }) => {
      const visibleRecordFieldsValue = store.get(visibleRecordFields);

      const indexOfRecordFieldToMove = visibleRecordFieldsValue.findIndex(
        (recordField) => recordField.id === recordFieldIdToMove,
      );

      if (indexOfRecordFieldToMove === -1) {
        return;
      }

      const targetArrayIndex =
        direction === 'before'
          ? indexOfRecordFieldToMove - 1
          : indexOfRecordFieldToMove + 1;

      if (
        targetArrayIndex < 0 ||
        targetArrayIndex > visibleRecordFieldsValue.length - 1
      ) {
        return;
      }

      const currentRecordField =
        visibleRecordFieldsValue[indexOfRecordFieldToMove];
      const targetRecordField = visibleRecordFieldsValue[targetArrayIndex];

      const targetRecordFieldNewPosition = currentRecordField.position;
      const currentRecordFieldNewPosition = targetRecordField.position;

      updateRecordField(
        targetRecordField.fieldMetadataItemId,
        {
          position: targetRecordFieldNewPosition,
        },
        targetRecordField.id,
      );

      updateRecordField(
        currentRecordField.fieldMetadataItemId,
        {
          position: currentRecordFieldNewPosition,
        },
        currentRecordField.id,
      );

      const currentViewId = store.get(currentViewIdCallbackState);
      const currentView = isDefined(currentViewId)
        ? getViewFromState(currentViewId)
        : undefined;
      const currentViewFields = currentView?.viewFields ?? [];

      await saveViewFields([
        mapRecordFieldToViewFieldFromCurrentView(
          {
            ...targetRecordField,
            position: targetRecordFieldNewPosition,
          },
          currentViewFields,
        ),
        mapRecordFieldToViewFieldFromCurrentView(
          {
            ...currentRecordField,
            position: currentRecordFieldNewPosition,
          },
          currentViewFields,
        ),
      ]);
    },
    [
      visibleRecordFields,
      saveViewFields,
      updateRecordField,
      store,
      currentViewIdCallbackState,
      getViewFromState,
    ],
  );

  return { moveRecordField };
};
