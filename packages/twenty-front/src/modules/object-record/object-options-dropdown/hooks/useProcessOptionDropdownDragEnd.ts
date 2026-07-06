import { type OnDragEndResponder } from '@hello-pangea/dnd';
import { contextStoreCurrentViewIdComponentState } from '@/context-store/states/contextStoreCurrentViewIdComponentState';
import { useReorderVisibleRecordFields } from '@/object-record/record-field/hooks/useReorderVisibleRecordFields';

import { useSaveCurrentViewFields } from '@/views/hooks/useSaveCurrentViewFields';
import { useGetViewFromState } from '@/views/hooks/useGetViewFromState';
import { mapRecordFieldToViewFieldFromCurrentView } from '@/views/utils/mapRecordFieldToViewFieldFromCurrentView';
import { useAtomComponentStateCallbackState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateCallbackState';
import { useCallback } from 'react';
import { useStore } from 'jotai';
import { isDefined } from 'twenty-shared/utils';

export const useProcessOptionDropdownDragEnd = (recordTableId: string) => {
  const store = useStore();
  const { getViewFromState } = useGetViewFromState();
  const currentViewIdCallbackState = useAtomComponentStateCallbackState(
    contextStoreCurrentViewIdComponentState,
  );

  const { reorderVisibleRecordFields } =
    useReorderVisibleRecordFields(recordTableId);

  const { saveViewFields } = useSaveCurrentViewFields();

  const processOptionDropdownDragEnd: OnDragEndResponder = useCallback(
    async (result) => {
      if (
        !result.destination ||
        result.destination.index === 1 ||
        result.source.index === 1
      ) {
        return;
      }

      const updatedRecordField = reorderVisibleRecordFields({
        fromIndex: result.source.index - 1,
        toIndex: result.destination.index - 1,
      });

      const currentViewId = store.get(currentViewIdCallbackState);
      const currentView = isDefined(currentViewId)
        ? getViewFromState(currentViewId)
        : undefined;

      saveViewFields([
        mapRecordFieldToViewFieldFromCurrentView(
          updatedRecordField,
          currentView?.viewFields ?? [],
        ),
      ]);
    },
    [
      currentViewIdCallbackState,
      getViewFromState,
      reorderVisibleRecordFields,
      saveViewFields,
      store,
    ],
  );

  return {
    processOptionDropdownDragEnd,
  };
};
