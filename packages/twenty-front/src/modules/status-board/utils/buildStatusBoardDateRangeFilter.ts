import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { hasStatusBoardField } from '@/status-board/utils/hasStatusBoardField';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';

export const buildStatusBoardDateRangeFilter = ({
  objectMetadataItem,
  preferredFieldName,
  fallbackFieldName,
  startDate,
  endDate,
}: {
  objectMetadataItem: EnrichedObjectMetadataItem;
  preferredFieldName: string;
  fallbackFieldName: string;
  startDate: string;
  endDate: string;
}): RecordGqlOperationFilter | undefined => {
  const fieldName = hasStatusBoardField(objectMetadataItem, preferredFieldName)
    ? preferredFieldName
    : hasStatusBoardField(objectMetadataItem, fallbackFieldName)
      ? fallbackFieldName
      : undefined;

  if (fieldName === undefined) {
    return undefined;
  }

  return {
    and: [
      {
        [fieldName]: {
          gte: startDate,
        },
      },
      {
        [fieldName]: {
          lte: endDate,
        },
      },
    ],
  };
};
