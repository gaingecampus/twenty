import { contextStoreCurrentViewIdComponentState } from '@/context-store/states/contextStoreCurrentViewIdComponentState';
import { type RecordField } from '@/object-record/record-field/types/RecordField';
import { useAtomComponentStateCallbackState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateCallbackState';
import { useSaveCurrentViewFields } from '@/views/hooks/useSaveCurrentViewFields';
import { useGetViewFromState } from '@/views/hooks/useGetViewFromState';
import { mapRecordFieldToViewFieldFromCurrentView } from '@/views/utils/mapRecordFieldToViewFieldFromCurrentView';
import { useStore } from 'jotai';
import { isDefined } from 'twenty-shared/utils';

export const useSaveRecordFields = () => {
  const store = useStore();
  const { saveViewFields } = useSaveCurrentViewFields();
  const { getViewFromState } = useGetViewFromState();
  const currentViewIdCallbackState = useAtomComponentStateCallbackState(
    contextStoreCurrentViewIdComponentState,
  );

  const saveRecordFields = (recordFields: RecordField[]) => {
    const currentViewId = store.get(currentViewIdCallbackState);
    const currentView = isDefined(currentViewId)
      ? getViewFromState(currentViewId)
      : undefined;
    const currentViewFields = currentView?.viewFields ?? [];

    saveViewFields(
      recordFields.map((recordField) =>
        mapRecordFieldToViewFieldFromCurrentView(recordField, currentViewFields),
      ),
    );
  };

  return {
    saveRecordFields,
  };
};
