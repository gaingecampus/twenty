import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { hasStatusBoardField } from '@/status-board/utils/hasStatusBoardField';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';

export const buildStatusBoardIdInFilter = ({
  objectMetadataItem,
  fieldNames,
  ids,
}: {
  objectMetadataItem: EnrichedObjectMetadataItem;
  fieldNames: string[];
  ids: string[];
}): RecordGqlOperationFilter | undefined => {
  if (ids.length === 0) {
    return undefined;
  }

  const existingFieldNames = fieldNames.filter((fieldName) =>
    hasStatusBoardField(objectMetadataItem, fieldName),
  );

  if (existingFieldNames.length === 0) {
    return undefined;
  }

  if (existingFieldNames.length === 1) {
    return {
      [existingFieldNames[0]]: { in: ids },
    };
  }

  return {
    or: existingFieldNames.map((fieldName) => ({
      [fieldName]: { in: ids },
    })),
  };
};
