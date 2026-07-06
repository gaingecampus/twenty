import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { getRelationRollupDisplayLabel } from '@/object-record/relation-rollup/utils/getRelationRollupDisplayLabel';
import { type ViewField } from '@/views/types/ViewField';
import { isDefined } from 'twenty-shared/utils';

export const getRecordFieldDisplayLabel = ({
  fieldMetadataItem,
  viewField,
  aggregateFieldLabel,
}: {
  fieldMetadataItem: FieldMetadataItem;
  viewField?: ViewField;
  aggregateFieldLabel?: string | null;
}): string => {
  if (isDefined(viewField?.relationRollup)) {
    return getRelationRollupDisplayLabel({
      relationFieldLabel: fieldMetadataItem.label,
      aggregateOperation: viewField.relationRollup.aggregateOperation,
      aggregateFieldLabel,
    });
  }

  return fieldMetadataItem.label;
};
