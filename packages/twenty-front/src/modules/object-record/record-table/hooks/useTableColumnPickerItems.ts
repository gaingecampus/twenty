import { contextStoreCurrentViewIdComponentState } from '@/context-store/states/contextStoreCurrentViewIdComponentState';
import { useActiveFieldMetadataItems } from '@/object-metadata/hooks/useActiveFieldMetadataItems';
import { useGetFieldMetadataItemByIdOrThrow } from '@/object-metadata/hooks/useGetFieldMetadataItemById';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { currentRecordFieldsComponentState } from '@/object-record/record-field/states/currentRecordFieldsComponentState';
import { type RecordField } from '@/object-record/record-field/types/RecordField';
import { visibleRecordFieldsComponentSelector } from '@/object-record/record-field/states/visibleRecordFieldsComponentSelector';
import { getAggregateFieldLabelForRelationRollup } from '@/object-record/relation-rollup/utils/getAggregateFieldLabelForRelationRollup';
import { useAtomComponentSelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentSelectorValue';
import { useAtomComponentStateCallbackState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateCallbackState';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { useGetViewFromState } from '@/views/hooks/useGetViewFromState';
import { type ViewField } from '@/views/types/ViewField';
import { getRecordFieldDisplayLabel } from '@/views/utils/getRecordFieldDisplayLabel';
import { isRelationRollupViewField } from '@/views/utils/isRelationRollupViewField';
import { useStore } from 'jotai';
import { useMemo } from 'react';
import { isDefined } from 'twenty-shared/utils';

export type HiddenViewFieldPickerItem = {
  recordField: RecordField;
  label: string;
  isRollup: boolean;
  fieldMetadataItem: FieldMetadataItem;
};

export const useTableColumnPickerItems = ({
  objectMetadataItem,
  recordIndexId,
}: {
  objectMetadataItem: EnrichedObjectMetadataItem;
  recordIndexId: string;
}) => {
  const store = useStore();
  const { getViewFromState } = useGetViewFromState();
  const { getFieldMetadataItemByIdOrThrow } =
    useGetFieldMetadataItemByIdOrThrow();

  const currentViewIdCallbackState = useAtomComponentStateCallbackState(
    contextStoreCurrentViewIdComponentState,
  );

  const currentRecordFields = useAtomComponentStateValue(
    currentRecordFieldsComponentState,
    recordIndexId,
  );

  const visibleRecordFields = useAtomComponentSelectorValue(
    visibleRecordFieldsComponentSelector,
    recordIndexId,
  );

  const { activeFieldMetadataItems } = useActiveFieldMetadataItems({
    objectMetadataItem,
  });

  const { objectMetadataItems } = useObjectMetadataItems();

  const getRollupFieldDisplayLabel = ({
    fieldMetadataItem,
    viewField,
  }: {
    fieldMetadataItem: FieldMetadataItem;
    viewField?: ViewField;
  }) => {
    const aggregateFieldLabel = isDefined(viewField?.relationRollup)
      ? getAggregateFieldLabelForRelationRollup({
          relationRollup: viewField.relationRollup,
          relationFieldMetadataItem: fieldMetadataItem,
          objectMetadataItems,
        })
      : undefined;

    return getRecordFieldDisplayLabel({
      fieldMetadataItem,
      viewField,
      aggregateFieldLabel,
    });
  };

  const currentViewId = store.get(currentViewIdCallbackState);
  const currentView = isDefined(currentViewId)
    ? getViewFromState(currentViewId)
    : undefined;

  const viewFieldById = useMemo(
    () =>
      new Map<string, ViewField>(
        (currentView?.viewFields ?? []).map((viewField) => [
          viewField.id,
          viewField,
        ]),
      ),
    [currentView?.viewFields],
  );

  const hasRegularRecordField = (fieldMetadataId: string) =>
    currentRecordFields.some((recordField) => {
      if (recordField.fieldMetadataItemId !== fieldMetadataId) {
        return false;
      }

      return !isRelationRollupViewField(viewFieldById.get(recordField.id));
    });

  const isRegularColumnVisible = (fieldMetadataId: string) =>
    visibleRecordFields.some((recordField) => {
      if (recordField.fieldMetadataItemId !== fieldMetadataId) {
        return false;
      }

      return !isRelationRollupViewField(viewFieldById.get(recordField.id));
    });

  const hiddenRegularFields = activeFieldMetadataItems.filter(
    (fieldMetadataItem) => !hasRegularRecordField(fieldMetadataItem.id),
  );

  const addableRegularFields = activeFieldMetadataItems.filter(
    (fieldMetadataItem) =>
      !isRegularColumnVisible(fieldMetadataItem.id) &&
      !hasRegularRecordField(fieldMetadataItem.id),
  );

  const hiddenViewFields: HiddenViewFieldPickerItem[] = currentRecordFields
    .filter((recordField) => recordField.isVisible === false)
    .map((recordField) => {
      const { fieldMetadataItem } = getFieldMetadataItemByIdOrThrow(
        recordField.fieldMetadataItemId,
      );
      const viewField = viewFieldById.get(recordField.id);

      return {
        recordField,
        label: getRollupFieldDisplayLabel({ fieldMetadataItem, viewField }),
        isRollup: isRelationRollupViewField(viewField),
        fieldMetadataItem,
      };
    });

  const hiddenRollupViewFields = hiddenViewFields.filter(
    (item) => item.isRollup,
  );

  const visibleRollupViewFields: HiddenViewFieldPickerItem[] =
    visibleRecordFields
      .filter((recordField) =>
        isRelationRollupViewField(viewFieldById.get(recordField.id)),
      )
      .map((recordField) => {
        const { fieldMetadataItem } = getFieldMetadataItemByIdOrThrow(
          recordField.fieldMetadataItemId,
        );
        const viewField = viewFieldById.get(recordField.id);

        return {
          recordField,
          label: getRollupFieldDisplayLabel({ fieldMetadataItem, viewField }),
          isRollup: true,
          fieldMetadataItem,
        };
      });

  const allRollupViewFields: HiddenViewFieldPickerItem[] = currentRecordFields
    .filter((recordField) =>
      isRelationRollupViewField(viewFieldById.get(recordField.id)),
    )
    .map((recordField) => {
      const { fieldMetadataItem } = getFieldMetadataItemByIdOrThrow(
        recordField.fieldMetadataItemId,
      );
      const viewField = viewFieldById.get(recordField.id);

      return {
        recordField,
        label: getRollupFieldDisplayLabel({ fieldMetadataItem, viewField }),
        isRollup: true,
        fieldMetadataItem,
      };
    });

  return {
    viewFieldById,
    hiddenRegularFields,
    addableRegularFields,
    hiddenViewFields,
    hiddenRollupViewFields,
    visibleRollupViewFields,
    allRollupViewFields,
    isRegularColumnVisible,
    hasRegularRecordField,
  };
};
