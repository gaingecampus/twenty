import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { type FieldMetadataItemRelation } from '@/object-metadata/types/FieldMetadataItemRelation';
import { type FieldRelationRollupMetadata } from '@/object-record/record-field/ui/types/FieldMetadata';
import { getRelationRollupDisplayLabel } from '@/object-record/relation-rollup/utils/getRelationRollupDisplayLabel';
import { type ViewField } from '@/views/types/ViewField';
import { FieldMetadataType, RelationType } from '~/generated-metadata/graphql';
import { isDefined } from 'twenty-shared/utils';

export const buildRelationRollupColumnDefinitionFromViewField = ({
  viewField,
  relationFieldMetadataItem,
  aggregateFieldMetadataItem,
  objectMetadataNameSingular,
}: {
  viewField: ViewField;
  relationFieldMetadataItem: FieldMetadataItem;
  aggregateFieldMetadataItem?: FieldMetadataItem;
  objectMetadataNameSingular: string;
}) => {
  if (!isDefined(viewField.relationRollup)) {
    return null;
  }

  const displayFieldType =
    aggregateFieldMetadataItem?.type === FieldMetadataType.CURRENCY
      ? FieldMetadataType.CURRENCY
      : FieldMetadataType.NUMBER;

  const metadata: FieldRelationRollupMetadata = {
    fieldName: `relationRollup_${viewField.id}`,
    objectMetadataNameSingular,
    isUIEditable: false,
    viewFieldId: viewField.id,
    relationRollup: viewField.relationRollup,
    relationFieldMetadataItem,
    aggregateFieldMetadataItem,
  };

  const relationSettings = relationFieldMetadataItem.relation as
    | FieldMetadataItemRelation
    | undefined;

  const label = getRelationRollupDisplayLabel({
    relationFieldLabel: relationFieldMetadataItem.label,
    aggregateOperation: viewField.relationRollup.aggregateOperation,
    aggregateFieldLabel: aggregateFieldMetadataItem?.label,
  });

  return {
    fieldMetadataId: viewField.fieldMetadataId,
    label,
    metadata,
    iconName: relationFieldMetadataItem.icon ?? 'IconSum',
    type: displayFieldType,
    position: viewField.position,
    size: viewField.size,
    isLabelIdentifier: false,
    isVisible: viewField.isVisible,
    viewFieldId: viewField.id,
    isUIEditable: false,
    isSortable: false,
    isFilterable: false,
    relationType: relationSettings?.type ?? RelationType.ONE_TO_MANY,
  };
};
