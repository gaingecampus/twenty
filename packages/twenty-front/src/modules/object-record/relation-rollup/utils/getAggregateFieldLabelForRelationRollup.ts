import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type RelationRollupSettings } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

export const getAggregateFieldLabelForRelationRollup = ({
  relationRollup,
  relationFieldMetadataItem,
  objectMetadataItems,
}: {
  relationRollup: RelationRollupSettings;
  relationFieldMetadataItem: FieldMetadataItem;
  objectMetadataItems: EnrichedObjectMetadataItem[];
}): string | undefined => {
  const aggregateFieldMetadataUniversalIdentifier =
    relationRollup.aggregateFieldMetadataUniversalIdentifier;

  if (!isDefined(aggregateFieldMetadataUniversalIdentifier)) {
    return undefined;
  }

  const targetObjectMetadataItem = objectMetadataItems.find(
    (objectMetadataItemToFind) =>
      objectMetadataItemToFind.id ===
      relationFieldMetadataItem.relation?.targetObjectMetadata.id,
  );

  return targetObjectMetadataItem?.fields.find(
    (field) =>
      field.universalIdentifier === aggregateFieldMetadataUniversalIdentifier,
  )?.label;
};
