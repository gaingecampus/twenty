import { RelationType } from '~/generated-metadata/graphql';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { getImageIdentifierFieldMetadataItem } from '@/object-metadata/utils/getImageIdentifierFieldMetadataItem';
import { getLabelIdentifierFieldMetadataItem } from '@/object-metadata/utils/getLabelIdentifierFieldMetadataItem';
import { type RecordGqlFields } from '@/object-record/graphql/record-gql-fields/types/RecordGqlFields';
import { isDefined } from 'twenty-shared/utils';

export const buildIdentifierGqlFields = (
  objectMetadata: Pick<
    EnrichedObjectMetadataItem,
    | 'fields'
    | 'labelIdentifierFieldMetadataId'
    | 'imageIdentifierFieldMetadataId'
    | 'nameSingular'
  >,
): RecordGqlFields => {
  const labelIdentifierField =
    getLabelIdentifierFieldMetadataItem(objectMetadata);
  const imageIdentifierField =
    getImageIdentifierFieldMetadataItem(objectMetadata);

  const linkedMemberField = ['member', 'teamMember'].includes(
    objectMetadata.nameSingular,
  )
    ? objectMetadata.fields.find(
        (field) =>
          field.relation?.targetObjectMetadata.nameSingular ===
            'workspaceMember' &&
          field.relation.type === RelationType.MANY_TO_ONE,
      )
    : undefined;

  return {
    id: true,
    ...(linkedMemberField && { [`${linkedMemberField.name}Id`]: true }),
    ...(isDefined(labelIdentifierField) && {
      [labelIdentifierField.name]: true,
    }),
    ...(isDefined(imageIdentifierField) && {
      [imageIdentifierField.name]: true,
    }),
  };
};
