import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type RecordGqlFields } from '@/object-record/graphql/record-gql-fields/types/RecordGqlFields';
import { hasStatusBoardField } from '@/status-board/utils/hasStatusBoardField';
import { FieldMetadataType } from 'twenty-shared/types';

export const buildStatusBoardRecordGqlFields = ({
  objectMetadataItem,
  fieldNames,
}: {
  objectMetadataItem: EnrichedObjectMetadataItem;
  fieldNames: string[];
}): RecordGqlFields => {
  const recordGqlFields: RecordGqlFields = { id: true };

  fieldNames.forEach((fieldName) => {
    if (!hasStatusBoardField(objectMetadataItem, fieldName)) {
      return;
    }

    const fieldMetadataItem = objectMetadataItem.readableFields.find(
      (item) => item.name === fieldName,
    );

    if (fieldMetadataItem?.type === FieldMetadataType.RELATION) {
      recordGqlFields[fieldName] = { id: true, name: true };
      return;
    }

    recordGqlFields[fieldName] = true;
  });

  return recordGqlFields;
};
