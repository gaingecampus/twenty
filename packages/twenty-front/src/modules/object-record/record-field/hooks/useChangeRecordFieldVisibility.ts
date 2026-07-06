import { contextStoreCurrentViewIdComponentState } from '@/context-store/states/contextStoreCurrentViewIdComponentState';
import { objectMetadataItemsSelector } from '@/object-metadata/states/objectMetadataItemsSelector';
import { useUpdateRecordField } from '@/object-record/record-field/hooks/useUpdateRecordField';
import { useUpsertRecordField } from '@/object-record/record-field/hooks/useUpsertRecordField';
import { useLoadRecordIndexStates } from '@/object-record/record-index/hooks/useLoadRecordIndexStates';
import { currentRecordFieldsComponentState } from '@/object-record/record-field/states/currentRecordFieldsComponentState';
import { type RecordField } from '@/object-record/record-field/types/RecordField';
import { useAtomComponentStateCallbackState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateCallbackState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useGetViewFromState } from '@/views/hooks/useGetViewFromState';
import { useSaveCurrentViewFields } from '@/views/hooks/useSaveCurrentViewFields';
import { type ViewField } from '@/views/types/ViewField';
import { isRelationRollupViewField } from '@/views/utils/isRelationRollupViewField';
import { mapRecordFieldToViewFieldFromCurrentView } from '@/views/utils/mapRecordFieldToViewFieldFromCurrentView';
import { useStore } from 'jotai';
import { useCallback } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { v4 } from 'uuid';
import { sortByProperty } from '~/utils/array/sortByProperty';

export const useChangeRecordFieldVisibility = (
  recordFieldComponentInstanceId?: string,
) => {
  const store = useStore();
  const { getViewFromState } = useGetViewFromState();

  const currentRecordFieldsCallbackState = useAtomComponentStateCallbackState(
    currentRecordFieldsComponentState,
    recordFieldComponentInstanceId,
  );

  const currentViewIdCallbackState = useAtomComponentStateCallbackState(
    contextStoreCurrentViewIdComponentState,
  );

  const { updateRecordField } = useUpdateRecordField(
    recordFieldComponentInstanceId,
  );
  const { upsertRecordField } = useUpsertRecordField(
    recordFieldComponentInstanceId,
  );

  const { saveViewFields } = useSaveCurrentViewFields();
  const { loadRecordIndexStates } = useLoadRecordIndexStates();
  const objectMetadataItems = useAtomStateValue(objectMetadataItemsSelector);

  const syncRecordIndexStatesAfterViewFieldChange = useCallback(
    (viewId: string) => {
      const updatedView = getViewFromState(viewId);

      if (!isDefined(updatedView)) {
        return;
      }

      const objectMetadataItem = objectMetadataItems.find(
        (objectMetadataItemToFind) =>
          objectMetadataItemToFind.id === updatedView.objectMetadataId,
      );

      if (!isDefined(objectMetadataItem)) {
        return;
      }

      loadRecordIndexStates(updatedView, objectMetadataItem);
    },
    [getViewFromState, loadRecordIndexStates, objectMetadataItems],
  );

  const changeRecordFieldVisibility = useCallback(
    async ({
      fieldMetadataId,
      viewFieldId,
      isVisible,
    }: {
      fieldMetadataId: string;
      viewFieldId?: string;
      isVisible: boolean;
    }) => {
      const currentRecordFields = store.get(currentRecordFieldsCallbackState);

      const lastPosition =
        currentRecordFields.toSorted(sortByProperty('position', 'desc'))?.[0]
          ?.position ?? 0;

      const shouldShowFieldMetadataItem = isVisible === true;

      const currentViewId = store.get(currentViewIdCallbackState);
      const currentView = isDefined(currentViewId)
        ? getViewFromState(currentViewId)
        : undefined;
      const currentViewFields = currentView?.viewFields ?? [];

      const viewFieldById = new Map(
        currentViewFields.map((viewField) => [viewField.id, viewField]),
      );

      const buildViewFieldToSave = (
        recordField: RecordField,
      ): Omit<ViewField, 'definition'> => {
        const viewFieldFromState =
          currentViewFields.find(
            (viewField) => viewField.id === recordField.id,
          ) ??
          (isDefined(viewFieldId) ? viewFieldById.get(viewFieldId) : undefined);

        return {
          ...mapRecordFieldToViewFieldFromCurrentView(
            recordField,
            currentViewFields,
          ),
          ...(isDefined(viewFieldFromState?.relationRollup)
            ? { relationRollup: viewFieldFromState.relationRollup }
            : {}),
        };
      };

      const findRegularRecordField = () =>
        currentRecordFields.find((recordField) => {
          if (recordField.fieldMetadataItemId !== fieldMetadataId) {
            return false;
          }

          return !isRelationRollupViewField(viewFieldById.get(recordField.id));
        });

      const correspondingRecordField = isDefined(viewFieldId)
        ? currentRecordFields.find(
            (recordFieldToFind) => recordFieldToFind.id === viewFieldId,
          )
        : findRegularRecordField();

      const noExistingRecordField = !isDefined(correspondingRecordField);

      if (noExistingRecordField) {
        if (!shouldShowFieldMetadataItem) {
          return;
        }

        const recordFieldToUpsert: RecordField = {
          id: v4(),
          fieldMetadataItemId: fieldMetadataId,
          size: 100,
          isVisible: shouldShowFieldMetadataItem,
          position: lastPosition + 1,
        };

        upsertRecordField(recordFieldToUpsert);

        await saveViewFields([
          buildViewFieldToSave(recordFieldToUpsert),
        ]);

        if (isDefined(currentViewId)) {
          syncRecordIndexStatesAfterViewFieldChange(currentViewId);
        }
      } else {
        updateRecordField(
          correspondingRecordField.fieldMetadataItemId,
          {
            isVisible: shouldShowFieldMetadataItem,
          },
          correspondingRecordField.id,
        );

        const updatedRecordField: RecordField = {
          ...correspondingRecordField,
          isVisible: shouldShowFieldMetadataItem,
        };

        await saveViewFields([buildViewFieldToSave(updatedRecordField)]);

        if (isDefined(currentViewId)) {
          syncRecordIndexStatesAfterViewFieldChange(currentViewId);
        }
      }
    },
    [
      currentRecordFieldsCallbackState,
      currentViewIdCallbackState,
      getViewFromState,
      saveViewFields,
      store,
      syncRecordIndexStatesAfterViewFieldChange,
      updateRecordField,
      upsertRecordField,
    ],
  );

  return {
    changeRecordFieldVisibility,
  };
};
