import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { getRelationJoinColumnName } from '@/object-record/record-field/ui/utils/junction/getRelationJoinColumnName';
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

  const existingFieldNames = [
    ...new Set(
      fieldNames.flatMap((fieldName) => {
        const field = objectMetadataItem.readableFields.find(
          (item) => item.name === fieldName,
        );
        if (field === undefined) return [];
        return [getRelationJoinColumnName(field) ?? fieldName];
      }),
    ),
  ];

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
