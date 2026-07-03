import { useRecordGalleryContextOrThrow } from '@/object-record/record-gallery/contexts/RecordGalleryContext';
import { recordGalleryCardEditModePositionComponentState } from '@/object-record/record-gallery/record-gallery-card/states/recordGalleryCardEditModePositionComponentState';
import { recordGalleryCardHoverPositionComponentState } from '@/object-record/record-gallery/record-gallery-card/states/recordGalleryCardHoverPositionComponentState';
import { visibleRecordFieldsComponentSelector } from '@/object-record/record-field/states/visibleRecordFieldsComponentSelector';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { useAtomComponentSelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentSelectorValue';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { isDefined } from 'twenty-shared/utils';

export const useRecordGalleryCardMetadataFromPosition = () => {
  const { objectMetadataItem } = useRecordGalleryContextOrThrow();

  const recordGalleryCardHoverPosition = useAtomComponentStateValue(
    recordGalleryCardHoverPositionComponentState,
  );

  const recordGalleryCardEditModePosition = useAtomComponentStateValue(
    recordGalleryCardEditModePositionComponentState,
  );

  const visibleRecordFields = useAtomComponentSelectorValue(
    visibleRecordFieldsComponentSelector,
  );

  const { labelIdentifierFieldMetadataItem } = useRecordIndexContextOrThrow();

  const visibleRecordFieldsFiltered = visibleRecordFields.filter(
    (recordField) =>
      labelIdentifierFieldMetadataItem?.id !== recordField.fieldMetadataItemId,
  );

  const hoveredRecordField = isDefined(recordGalleryCardHoverPosition)
    ? visibleRecordFieldsFiltered.at(recordGalleryCardHoverPosition)
    : undefined;

  const editedRecordField = isDefined(recordGalleryCardEditModePosition)
    ? visibleRecordFieldsFiltered.at(recordGalleryCardEditModePosition)
    : undefined;

  const hoveredFieldMetadataItem = isDefined(hoveredRecordField)
    ? objectMetadataItem.fields.find(
        (fieldMetadataItem) =>
          fieldMetadataItem.id === hoveredRecordField.fieldMetadataItemId,
      )
    : undefined;

  const editedFieldMetadataItem = isDefined(editedRecordField)
    ? objectMetadataItem.fields.find(
        (fieldMetadataItem) =>
          fieldMetadataItem.id === editedRecordField.fieldMetadataItemId,
      )
    : undefined;

  return {
    hoveredFieldMetadataItem,
    editedFieldMetadataItem,
  };
};
