import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { CoreObjectNameSingular, RelationType } from 'twenty-shared/types';

export const getCompanyAvatarRelationField = (
  objectNameSingular: string,
  fields: FieldMetadataItem[],
) => {
  if (!['opportunity', 'onboarding', 'deposit'].includes(objectNameSingular)) {
    return undefined;
  }

  const companyFields = fields.filter(
    (field) =>
      field.relation?.targetObjectMetadata.nameSingular ===
        CoreObjectNameSingular.Company &&
      field.relation.type === RelationType.MANY_TO_ONE,
  );

  return (
    companyFields.find((field) => field.name === 'company') ?? companyFields[0]
  );
};
