import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';

export const hasStatusBoardField = (
  objectMetadataItem: EnrichedObjectMetadataItem | undefined,
  fieldName: string,
): boolean => {
  return (
    objectMetadataItem?.readableFields.some(
      (fieldMetadataItem) => fieldMetadataItem.name === fieldName,
    ) === true
  );
};
